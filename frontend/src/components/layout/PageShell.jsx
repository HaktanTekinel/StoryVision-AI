export default function PageShell({ eyebrow, title, description, children, actions }) {
  return (
    <section className="page-shell">
      <div className="page-heading">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <div className="heading-row">
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="heading-actions">{actions}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}
