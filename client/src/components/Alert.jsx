/**
 * Small inline banner for success/error messages.
 * `details` (from server validation) are rendered as a bullet list when present.
 */
export default function Alert({ type = 'error', message, details }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`} role="alert">
      <div>{message}</div>
      {Array.isArray(details) && details.length > 0 && (
        <ul className="alert-details">
          {details.map((d, i) => (
            <li key={i}>
              {d.field ? `${d.field}: ` : ''}
              {d.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
