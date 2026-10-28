import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { postForm } from "../lib/api";
import Icon from "./Icon";
import {
  buttonClass,
  cardClass,
  Feedback,
  Field,
  inputClass,
  Spinner,
} from "./ui";

export interface ComplaintFormProps {
  endpoint?: string;
  csrfToken?: string;
  demo?: boolean;
  initialName?: string;
  onSubmitted?: () => void;
}
const complaintTypes = [
  "Noise Disturbance",
  "Garbage Disposal",
  "Pet Nuisance",
  "Property Dispute",
  "Verbal Altercation",
  "Other",
];
export default function ComplaintForm({
  endpoint = "/api/complaints/",
  csrfToken,
  demo = false,
  initialName = "",
  onSubmitted,
}: ComplaintFormProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPhoto(null);
    setError("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    ) {
      setError("Please choose a JPG or PNG image up to 5 MB.");
      event.target.value = "";
      return;
    }
    setPhoto(file);
  }
  function removePhoto() {
    setPhoto(null);
    if (fileInput.current) fileInput.current.value = "";
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!photo) {
      setError("Please attach a photo before submitting.");
      return;
    }
    const data = new FormData(event.currentTarget);
    for (const name of [
      "full_name",
      "contact_number",
      "address",
      "description",
    ]) {
      const value = String(data.get(name) || "").trim();
      if (!value) {
        setError("Please complete all required fields.");
        return;
      }
      data.set(name, value);
    }
    if (demo) {
      dialog.current?.showModal();
      return;
    }
    setBusy(true);
    try {
      await postForm(endpoint, data, csrfToken);
      form.current?.reset();
      removePhoto();
      dialog.current?.showModal();
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your complaint.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={`${cardClass} complaint-form`}
      aria-labelledby="complaint-title"
    >
      <h2 id="complaint-title" className="form-title">
        Tell us about your concern.
      </h2>
      <p className="form-intro">
        A few details will help your barangay team understand and review the
        issue. All fields are required.
      </p>
      {demo && (
        <div className="demo-note" style={{ marginBottom: 20 }}>
          Preview mode. Information and photos are not uploaded or saved.
        </div>
      )}
      <form
        ref={form}
        onSubmit={submit}
        encType="multipart/form-data"
        aria-busy={busy}
      >
        {csrfToken && (
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
        )}
        <fieldset
          disabled={busy}
          className="form-stack"
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <legend className="sr-only">Complaint details</legend>
          {error && <Feedback error>{error}</Feedback>}
          <div className="form-row">
            <Field id="full_name" label="Full name *">
              <input
                id="full_name"
                name="full_name"
                required
                autoComplete="name"
                maxLength={150}
                defaultValue={initialName}
                placeholder="Your full name"
                className={inputClass}
              />
            </Field>
            <Field id="contact_number" label="Contact number *">
              <input
                id="contact_number"
                name="contact_number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                maxLength={30}
                placeholder="09XX-XXX-XXXX"
                className={inputClass}
              />
            </Field>
          </div>
          <Field id="address" label="Address / Purok *">
            <input
              id="address"
              name="address"
              autoComplete="street-address"
              required
              maxLength={300}
              placeholder="Your complete address or purok"
              className={inputClass}
            />
          </Field>
          <Field id="complaint_type" label="Complaint type *">
            <select
              id="complaint_type"
              name="complaint_type"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Select a complaint type
              </option>
              {complaintTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field id="description" label="What happened? *">
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              maxLength={5000}
              placeholder="Describe the issue, including when and where it happened…"
              className={inputClass}
            />
          </Field>
          <Field id="photo" label="Photo / evidence *">
            <div className="upload-area">
              <Icon
                name="upload"
                size={22}
                style={{ color: "var(--teal)", marginBottom: 2 }}
              />
              <input
                ref={fileInput}
                id="photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png"
                required
                onChange={changePhoto}
                aria-describedby="photo-note"
              />
              <p id="photo-note" className="upload-note">
                Choose a clear photo. JPG or PNG · Up to 5 MB.
              </p>
            </div>
          </Field>
          {preview && (
            <figure className="photo-preview">
              <img
                src={preview}
                alt="Selected evidence preview"
                decoding="async"
                width={640}
                height={360}
              />
              <figcaption className="photo-caption">
                <span>{photo?.name}</span>
                <button
                  type="button"
                  className="text-link"
                  style={{
                    fontSize: 11,
                    minHeight: 32,
                    background: "none",
                    border: 0,
                  }}
                  onClick={removePhoto}
                >
                  Remove
                </button>
              </figcaption>
            </figure>
          )}
          <div className="form-footer">
            <p>Your report is shared privately with your barangay team.</p>
            <button type="submit" className={buttonClass}>
              {busy ? (
                <>
                  <Spinner />
                  Submitting…
                </>
              ) : (
                <>
                  {demo ? "Preview submission" : "Submit complaint"}
                  <Icon name="arrow" size={15} />
                </>
              )}
            </button>
          </div>
        </fieldset>
      </form>
      <dialog
        ref={dialog}
        aria-labelledby="success-title"
        aria-describedby="success-description"
        className="success-dialog"
      >
        <div className="success-mark">
          <Icon name={demo ? "clipboard" : "check"} size={25} />
        </div>
        <p className="eyebrow">Your voice matters</p>
        <h2 id="success-title" style={{ marginTop: 9 }}>
          {demo ? "Preview complete." : "You’ve been heard."}
        </h2>
        <p id="success-description">
          {demo
            ? "Your form passed the browser checks. Nothing was submitted."
            : "Thank you for sharing your concern. Your complaint has been submitted for review. You can follow its progress in My complaints."}
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => dialog.current?.close()}
          className={buttonClass}
        >
          OK
          <Icon name="check" size={16} />
        </button>
      </dialog>
    </section>
  );
}
