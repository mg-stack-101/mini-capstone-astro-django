import Icon from "./Icon";
export default function Pagination({
  page,
  count,
  hasPrevious,
  hasNext,
  disabled,
  onPage,
}: {
  page: number;
  count: number;
  hasPrevious: boolean;
  hasNext: boolean;
  disabled: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <nav aria-label="Complaint pages" className="pagination">
      <p>
        Page {page}
        <span style={{ margin: "0 7px" }}>·</span>
        {count} result{count === 1 ? "" : "s"}
      </p>
      <div className="pagination-actions">
        <button
          disabled={disabled || !hasPrevious}
          onClick={() => onPage(page - 1)}
          className="button button-secondary"
        >
          <Icon name="arrowLeft" size={13} />
          Previous
        </button>
        <button
          disabled={disabled || !hasNext}
          onClick={() => onPage(page + 1)}
          className="button button-secondary"
        >
          Next
          <Icon name="arrow" size={13} />
        </button>
      </div>
    </nav>
  );
}
