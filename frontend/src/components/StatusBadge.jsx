const STATUS_STYLES = {
  Submitted: 'bg-blue-100 text-blue-800 border border-blue-300',
  'Under Scrutiny': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  Selected: 'bg-green-100 text-green-800 border border-green-300',
  Rejected: 'bg-red-100 text-red-800 border border-red-300',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Submitted;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
