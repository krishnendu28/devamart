import { useState } from 'react';
import { CITY_NAMES, citiesOfState, stateForCity } from '../data/cities';

/**
 * City dropdown with a manual fallback for towns that are not in the list.
 * Calls onChange(city, state) — `state` is undefined while typing manually so
 * the parent can keep whatever state the user already entered.
 */
export default function CitySelect({ value, onChange, required = false, id = 'city' }) {
  const known = CITY_NAMES.includes(value);
  const [manual, setManual] = useState(!!value && !known);

  function pick(e) {
    const next = e.target.value;
    if (next === '__other') {
      setManual(true);
      onChange('', '');
      return;
    }
    onChange(next, stateForCity(next));
  }

  return (
    <div className="city-select">
      {manual ? (
        <div className="city-manual">
          <input
            id={id}
            list="dm-city-list"
            value={value || ''}
            onChange={e => onChange(e.target.value, undefined)}
            placeholder="Type your city"
            required={required}
          />
          <button type="button" className="city-back" onClick={() => { setManual(false); onChange('', ''); }}>
            Pick from list
          </button>
        </div>
      ) : (
        <select id={id} value={known ? value : ''} onChange={pick} required={required}>
          <option value="">Select your city</option>
          {citiesOfState().map(group => (
            <optgroup key={group.state} label={group.state}>
              {group.cities.map(city => <option key={city} value={city}>{city}</option>)}
            </optgroup>
          ))}
          <option value="__other">Other city (type manually)…</option>
        </select>
      )}
      <datalist id="dm-city-list">
        {CITY_NAMES.map(city => <option key={city} value={city} />)}
      </datalist>
    </div>
  );
}
