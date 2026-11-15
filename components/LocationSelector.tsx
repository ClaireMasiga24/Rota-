'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { District, LocationContext, Parish, Village } from '@/lib/locations';

type Stage = 'district' | 'parish' | 'village';

interface StageOption {
  id: number;
  name: string;
}

function labelFor(stage: Stage): string {
  return stage === 'district' ? 'District' : stage === 'parish' ? 'Parish' : 'Village';
}

function placeholderFor(stage: Stage): string {
  return stage === 'district'
    ? 'Select a district'
    : stage === 'parish'
    ? 'Select a parish'
    : 'Select a village';
}

function searchMatches(option: StageOption, search: string): boolean {
  if (!search) return true;
  return option.name.toLowerCase().includes(search.trim().toLowerCase());
}

interface SearchableDropdownProps {
  stage: Stage;
  options: StageOption[];
  search: string;
  onSearchChange: (value: string) => void;
  value: StageOption | null;
  disabled: boolean;
  loading: boolean;
  onSelect: (option: StageOption) => void;
}

function SearchableDropdown({
  stage,
  options,
  search,
  onSearchChange,
  value,
  disabled,
  loading,
  onSelect,
}: SearchableDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const filtered = options.filter(o => searchMatches(o, search));
  const empty = filtered.length === 0 && search.trim() !== '' && !loading;

  useEffect(() => {
    setFocusedIndex(-1);
    const input = inputRef.current;
    if (input && value) input.value = value.name;
  }, [value, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listboxRef.current &&
        !listboxRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'Escape') { setOpen(false); return; }
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') { setOpen(true); setFocusedIndex(0); }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[focusedIndex];
      if (option) {
        onSelect(option);
        setOpen(false);
      }
      return;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
    setOpen(true);
    setFocusedIndex(0);
  };

  const handleFocus = () => { setOpen(true); };

  const scrollFocusedIntoView = () => {
    const box = listboxRef.current;
    if (!box) return;
    const node = box.querySelector(`[data-index="${focusedIndex}"]`);
    if (!node || !(node instanceof HTMLElement)) return;
    const nodeTop = node.offsetTop;
    const nodeBottom = nodeTop + node.offsetHeight;
    const viewTop = box.scrollTop;
    const viewBottom = viewTop + box.clientHeight;
    if (nodeTop < viewTop) box.scrollTop = nodeTop;
    else if (nodeBottom > viewBottom) box.scrollTop = nodeBottom - box.clientHeight;
  };

  useEffect(() => {
    if (open && focusedIndex >= 0) scrollFocusedIntoView();
  }, [open, focusedIndex, filtered]);

  return (
    <div className="location-stage">
      <label className="field-stage-label">{labelFor(stage)}</label>
      <div className="location-select" onClick={() => !disabled && setOpen(true)}>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={`rota-location-listbox-${stage}`}
          aria-activedescendant={
            open && focusedIndex >= 0 ? `rota-location-option-${stage}-${focusedIndex}` : undefined
          }
          value={value ? value.name : search}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholderFor(stage)}
        />
        {loading && <span className="location-loading">Loading&hellip;</span>}
      </div>
      {(open && !disabled) && (
        <ul
          ref={listboxRef}
          id={`rota-location-listbox-${stage}`}
          role="listbox"
          aria-label={labelFor(stage)}
          className={`location-listbox ${empty ? 'location-listbox-empty' : ''}`}
        >
          {loading && !value && (
            <li role="presentation" className="location-option location-option-disabled">
              Loading {labelFor(stage).toLowerCase()}s&hellip;
            </li>
          )}
          {empty && (
            <li role="presentation" className="location-option location-option-disabled">
              No matching {labelFor(stage).toLowerCase()}s
            </li>
          )}
          {!loading && filtered.length === 0 && !search.trim() && (
            <li role="presentation" className="location-option location-option-disabled">
              No {labelFor(stage).toLowerCase()}s available
            </li>
          )}
          {filtered.map((option, index) => (
            <li
              key={option.id}
              role="option"
              aria-selected={value?.id === option.id}
              data-index={index}
              id={`rota-location-option-${stage}-${index}`}
              className={`location-option ${
                value?.id === option.id ? 'location-option-selected' : ''
              } ${focusedIndex === index ? 'location-option-focus' : ''}`}
              onMouseMove={() => setFocusedIndex(index)}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface LocationSelectorProps {
  onDistrictChange: (district: District | null) => void;
  onChange: (context: LocationContext | null) => void;
}

export default function LocationSelector({
  onDistrictChange,
  onChange,
}: LocationSelectorProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [parishSearch, setParishSearch] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedParish, setSelectedParish] = useState<Parish | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [loading, setLoading] = useState<{
    districts: boolean;
    parishes: boolean;
    villages: boolean;
  }>({ districts: true, parishes: false, villages: false });
  const [error, setError] = useState<string | null>(null);

  const fetchJson = useCallback(async (url: string) => {
    const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(prev => ({ ...prev, districts: true }));
    fetchJson('/api/locations/districts')
      .then((data: { districts: District[]; count: number }) => {
        if (!cancelled) {
          setDistricts(data.districts ?? []);
          setLoading(prev => ({ ...prev, districts: false }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load districts');
          setLoading(prev => ({ ...prev, districts: false }));
        }
      });
    return () => { cancelled = true; };
  }, [fetchJson]);

  useEffect(() => {
    let cancelled = false;
    setParishes([]);
    setSelectedParish(null);
    setSelectedVillage(null);
    setVillages([]);
    setParishSearch('');
    setVillageSearch('');
    if (!selectedDistrict) {
      onDistrictChange(null);
      setLoading(prev => ({ ...prev, parishes: false }));
      return;
    }
    setLoading(prev => ({ ...prev, parishes: true }));
    setError(null);
    fetchJson(`/api/locations/parishes?districtId=${selectedDistrict.id}`)
      .then((data: { parishes: Parish[]; count: number }) => {
        if (!cancelled) {
          setParishes(data.parishes ?? []);
          setLoading(prev => ({ ...prev, parishes: false }));
          onDistrictChange(selectedDistrict);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load parishes');
          setLoading(prev => ({ ...prev, parishes: false }));
        }
      });
    return () => { cancelled = true; };
  }, [selectedDistrict, fetchJson, onDistrictChange]);

  useEffect(() => {
    let cancelled = false;
    setVillages([]);
    setSelectedVillage(null);
    setVillageSearch('');
    if (!selectedParish) {
      onChange(null);
      setLoading(prev => ({ ...prev, villages: false }));
      return;
    }
    setLoading(prev => ({ ...prev, villages: true }));
    fetchJson(`/api/locations/villages?parishId=${selectedParish.id}`)
      .then((data: { villages: Village[]; count: number }) => {
        if (!cancelled) {
          setVillages(data.villages ?? []);
          setLoading(prev => ({ ...prev, villages: false }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load villages');
          setLoading(prev => ({ ...prev, villages: false }));
        }
      });
    return () => { cancelled = true; };
  }, [selectedParish, fetchJson]);

  const filteredDistricts = districts.filter(d => searchMatches({ id: d.id, name: d.name }, districtSearch));
  const filteredParishes = parishes.filter(p => searchMatches({ id: p.id, name: p.name }, parishSearch));
  const filteredVillages = villages.filter(v => searchMatches({ id: v.id, name: v.name }, villageSearch));

  const handleDistrictSelect = useCallback((option: StageOption) => {
    const district = districts.find(d => d.id === option.id)!;
    setSelectedDistrict(district);
    setSelectedParish(null);
    setSelectedVillage(null);
    setParishes([]);
    setVillages([]);
    setDistrictSearch('');
    setParishSearch('');
    setVillageSearch('');
  }, [districts]);

  const handleParishSelect = useCallback((option: StageOption) => {
    const parish = parishes.find(p => p.id === option.id)!;
    setSelectedParish(parish);
    setSelectedVillage(null);
    setVillages([]);
    setParishSearch('');
    setVillageSearch('');
  }, [parishes]);

  const handleVillageSelect = useCallback((option: StageOption) => {
    const village = villages.find(v => v.id === option.id)!;
    setSelectedVillage(village);
    setVillageSearch('');
    if (selectedDistrict && selectedParish) {
      onChange({ district: selectedDistrict, parish: selectedParish, village });
    }
  }, [villages, selectedDistrict, selectedParish, onChange]);

  const isLoading = loading.districts || loading.parishes || loading.villages;

  return (
    <div className="location-selector">
      {error && <div className="location-error">{error}</div>}
      <SearchableDropdown
        stage="district"
        options={districts.map(d => ({ id: d.id, name: d.name }))}
        search={districtSearch}
        onSearchChange={setDistrictSearch}
        value={selectedDistrict ?? null}
        disabled={false}
        loading={loading.districts}
        onSelect={handleDistrictSelect}
      />
      <SearchableDropdown
        stage="parish"
        options={parishes.map(p => ({ id: p.id, name: p.name }))}
        search={parishSearch}
        onSearchChange={setParishSearch}
        value={selectedParish ?? null}
        disabled={!selectedDistrict}
        loading={loading.parishes}
        onSelect={handleParishSelect}
      />
      <SearchableDropdown
        stage="village"
        options={villages.map(v => ({ id: v.id, name: v.name }))}
        search={villageSearch}
        onSearchChange={setVillageSearch}
        value={selectedVillage ?? null}
        disabled={!selectedParish}
        loading={loading.villages}
        onSelect={handleVillageSelect}
      />
      {!isLoading && !error && districts.length === 0 && <div className="location-empty">No districts found.</div>}
      {!isLoading &&
        !error &&
        selectedDistrict &&
        !selectedParish &&
        parishes.length === 0 && (
          <div className="location-empty">No parishes found for this district.</div>
        )}
      {!isLoading &&
        !error &&
        selectedParish &&
        !selectedVillage &&
        villages.length === 0 && (
          <div className="location-empty">No villages found for this parish.</div>
        )}
    </div>
  );
}
