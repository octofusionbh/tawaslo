import { useEffect, useId, useState } from "react";
import { DEFAULT_INVOICE_COLOR, normalizeInvoiceHex } from "./invoiceColor";
import "./invoice-color-picker.css";

export default function InvoiceColorPicker({ value, onChange, onValidityChange, presets, isAR = false }) {
  const L = (en, ar) => isAR ? ar : en;
  const id = useId();
  const color = normalizeInvoiceHex(value) || DEFAULT_INVOICE_COLOR;
  const [draft, setDraft] = useState(color);
  const [touched, setTouched] = useState(false);
  const invalid = normalizeInvoiceHex(draft) === null;

  useEffect(() => {
    // Keep partially typed short HEX intact when its normalized color is applied.
    setDraft(current => normalizeInvoiceHex(current) === color ? current : color);
    setTouched(false);
  }, [color]);

  const pickColor = next => {
    const normalized = normalizeInvoiceHex(next);
    if (!normalized) return;
    setDraft(normalized);
    setTouched(false);
    onValidityChange(true);
    onChange(normalized);
  };

  const changeHex = event => {
    const next = event.target.value;
    const normalized = normalizeInvoiceHex(next);
    setDraft(next);
    onValidityChange(normalized !== null);
    if (normalized) onChange(normalized);
  };

  const finishHex = () => {
    const normalized = normalizeInvoiceHex(draft);
    setTouched(true);
    onValidityChange(normalized !== null);
    if (normalized) pickColor(normalized);
  };

  return (
    <fieldset className="tw-invoice-color">
      <legend>{L("Invoice color", "لون الفاتورة")}</legend>
      <div className="tw-invoice-color-swatches">
        {presets.map(preset => (
          <button
            key={preset.name}
            type="button"
            aria-label={`${preset.name} (${preset.accent.toUpperCase()})`}
            title={preset.name}
            aria-pressed={color === normalizeInvoiceHex(preset.accent)}
            onClick={() => pickColor(preset.accent)}
          >
            <span aria-hidden="true" style={{ backgroundColor: preset.accent }} />
          </button>
        ))}
      </div>
      <div className="tw-invoice-hex-row">
        <div className="tw-invoice-hex-field">
          <label htmlFor={`${id}-hex`}>{L("Custom HEX", "رمز HEX مخصص")}</label>
          <div className="tw-invoice-custom-input">
          <input
            type="color"
            aria-label={L("Choose invoice color", "اختر لون الفاتورة")}
            title={L("Choose any color", "اختر أي لون")}
            value={color}
            onChange={event => pickColor(event.target.value)}
          />
          <input
            id={`${id}-hex`}
            type="text"
            dir="ltr"
            value={draft}
            onChange={changeHex}
            onBlur={finishHex}
            onKeyDown={event => {
              if (event.key === "Enter") {
                event.preventDefault();
                finishHex();
              }
            }}
            placeholder="#FF5D4D"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={touched && invalid}
            aria-describedby={`${id}-help`}
          />
          </div>
        </div>
        <p id={`${id}-help`} className={touched && invalid ? "is-error" : ""} aria-live="polite">
          {touched && invalid
            ? L("Enter 3 or 6 HEX digits, such as #F60 or #FF6600. Your previous color is kept until the code is valid.", "أدخل 3 أو 6 خانات HEX، مثل #F60 أو #FF6600. يبقى اللون السابق حتى يصبح الرمز صحيحاً.")
            : L("Type a HEX code or click the color swatch. Both stay in sync.", "أدخل رمز HEX أو اضغط على مربع اللون. يتزامن الخياران تلقائياً.")}
        </p>
      </div>
    </fieldset>
  );
}
