"use client";

import { memo, useCallback, useMemo } from "react";
import type { RevenueDestinationDraft, RevenueDestinationFieldValues } from "@sonafrik/types";
import {
  formatMethodOptionLabel,
  formatNationalPhoneDisplay,
  getRevenueCountry,
  getRevenueMethod,
  getRevenueMethodsForCountry,
  isRevenueDestinationValid,
  REVENUE_COUNTRIES,
  sanitizeNationalDigits,
  validateRevenueDestination,
  type RevenueFieldDefinition,
  type RevenueSetupMode,
} from "@sonafrik/shared";

export type { RevenueDestinationDraft };

export interface RevenueDestinationSetupProps {
  value: RevenueDestinationDraft;
  onChange: (value: RevenueDestinationDraft) => void;
  /** onboarding = MVP uniquement (1 méthode, mobile money actif) */
  mode?: RevenueSetupMode;
  showInfo?: boolean;
}

function updateField(
  draft: RevenueDestinationDraft,
  key: keyof RevenueDestinationFieldValues,
  raw: string,
): RevenueDestinationDraft {
  const value = key === "phoneNational" ? sanitizeNationalDigits(raw) : raw;
  return { ...draft, fields: { ...draft.fields, [key]: value } };
}

interface DynamicFieldProps {
  draft: RevenueDestinationDraft;
  field: RevenueFieldDefinition;
  onFieldChange: (key: keyof RevenueDestinationFieldValues, raw: string) => void;
}

const DynamicField = memo(function DynamicField({
  draft,
  field,
  onFieldChange,
}: DynamicFieldProps) {
  const country = getRevenueCountry(draft.countryCode);
  const isPhone = field.key === "phoneNational";
  const displayValue = isPhone
    ? formatNationalPhoneDisplay(draft.fields.phoneNational ?? "")
    : (draft.fields[field.key] ?? "");

  if (isPhone) {
    return (
      <div className="revenue-destination__field">
        <label className="revenue-destination__label" htmlFor={`rd-${field.key}`}>
          {field.label}
        </label>
        <div className="revenue-destination__phone-row">
          <div className="revenue-destination__dial" aria-hidden="true">
            {country?.dialCode ?? "+224"}
          </div>
          <input
            id={`rd-${field.key}`}
            type="tel"
            inputMode={field.inputMode ?? "numeric"}
            autoComplete={field.autoComplete}
            className="revenue-destination__input revenue-destination__phone-input"
            placeholder={field.placeholder}
            value={displayValue}
            onChange={(e) => onFieldChange(field.key, e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-destination__field">
      <label className="revenue-destination__label" htmlFor={`rd-${field.key}`}>
        {field.label}
      </label>
      <input
        id={`rd-${field.key}`}
        type="text"
        inputMode={field.inputMode ?? "text"}
        autoComplete={field.autoComplete}
        className="revenue-destination__input"
        placeholder={field.placeholder}
        value={displayValue}
        onChange={(e) => onFieldChange(field.key, e.target.value)}
      />
    </div>
  );
});

export const RevenueDestinationSetup = memo(function RevenueDestinationSetup({
  value,
  onChange,
  mode = "onboarding",
  showInfo = true,
}: RevenueDestinationSetupProps) {
  const methods = useMemo(
    () => getRevenueMethodsForCountry(value.countryCode, mode),
    [value.countryCode, mode],
  );
  const method = getRevenueMethod(value.methodId);
  const validation = useMemo(() => validateRevenueDestination(value), [value]);

  const handleCountryChange = useCallback(
    (countryCode: string) => {
      const nextMethods = getRevenueMethodsForCountry(countryCode, mode);
      const stillValid = nextMethods.some((m) => m.id === value.methodId);
      onChange({
        countryCode,
        methodId: stillValid ? value.methodId : (nextMethods[0]?.id ?? "orange_money"),
        fields: value.fields,
      });
    },
    [mode, onChange, value.fields, value.methodId],
  );

  const handleMethodChange = useCallback(
    (methodId: string) => {
      onChange({ ...value, methodId, fields: {} });
    },
    [onChange, value],
  );

  const handleFieldChange = useCallback(
    (key: keyof RevenueDestinationFieldValues, raw: string) => {
      onChange(updateField(value, key, raw));
    },
    [onChange, value],
  );

  return (
    <div className="revenue-destination">
      <div className="revenue-destination__field">
        <label className="revenue-destination__label" htmlFor="rd-country">
          Pays
        </label>
        <select
          id="rd-country"
          className="revenue-destination__select"
          value={value.countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          {REVENUE_COUNTRIES.map(({ code, flag, name }) => (
            <option key={code} value={code}>
              {flag} {name}
            </option>
          ))}
        </select>
      </div>

      <div className="revenue-destination__field">
        <label className="revenue-destination__label" htmlFor="rd-method">
          Mode de réception
        </label>
        <select
          id="rd-method"
          className="revenue-destination__select"
          value={value.methodId}
          onChange={(e) => handleMethodChange(e.target.value)}
        >
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {formatMethodOptionLabel(m)}
            </option>
          ))}
        </select>
        {method?.availability === "future" ? (
          <p className="revenue-destination__hint revenue-destination__hint--hint">
            Cette option arrive bientôt sur SONAFRIK.
          </p>
        ) : null}
      </div>

      {method?.fields.map((field) => (
        <DynamicField
          key={field.key}
          draft={value}
          field={field}
          onFieldChange={handleFieldChange}
        />
      ))}

      <p
        className={`revenue-destination__hint revenue-destination__hint--${validation.tone}`}
        role="status"
        aria-live="polite"
      >
        {validation.message}
      </p>

      {showInfo ? (
        <aside className="revenue-destination__info" aria-label="Informations">
          <p className="revenue-destination__info-title">ℹ️ Informations</p>
          <p className="revenue-destination__info-text">
            Les revenus générés sur SONAFRIK seront versés sur cette destination. Vous pourrez
            ajouter d&apos;autres méthodes et définir une méthode principale plus tard depuis vos
            paramètres.
          </p>
        </aside>
      ) : null}
    </div>
  );
});

export function isRevenueDestinationSetupValid(draft: RevenueDestinationDraft): boolean {
  return isRevenueDestinationValid(draft);
}
