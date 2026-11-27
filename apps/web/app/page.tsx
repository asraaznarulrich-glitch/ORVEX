const modules = [
  "Clients & prospects",
  "Payments & reminders",
  "Learning & certificates",
  "AI business assistant",
  "Content & video studio",
  "Team workspaces",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <nav className="topbar">
        <a className="wordmark" href="/" aria-label="ORVEX home">
          <span className="mark">O</span> ORVEX
        </a>
        <div className="language-switch" aria-label="Language">
          <button type="button" aria-pressed="true">FR</button>
          <button type="button" aria-pressed="false">EN</button>
        </div>
      </nav>

      <section className="hero">
        <p className="eyebrow">THE BUSINESS PLATFORM</p>
        <h1>Tout votre business.<br /><span>Un seul espace.</span></h1>
        <p className="intro">
          ORVEX rassemble vos clients, vos paiements, vos formations et vos
          outils intelligents dans un espace de travail conçu pour évoluer
          avec votre activité.
        </p>
        <div className="actions">
          <a className="primary-button" href="#modules">Découvrir ORVEX <span aria-hidden="true">↗</span></a>
          <a className="secondary-link" href="#vision">Notre vision</a>
        </div>
        <div className="hero-note"><span className="status-dot" /> Une plateforme. 20 modules prévus. Un seul espace.</div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">UN ÉCOSYSTÈME CONNECTÉ</p>
          <h2>Tout avance ensemble.</h2>
        </div>
        <div className="module-grid">
          {modules.map((module, index) => (
            <article className="module-card" key={module}>
              <span className="module-number">0{index + 1}</span>
              <h3>{module}</h3>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="vision" id="vision">
        <p className="eyebrow">BUILT FOR WHAT'S NEXT</p>
        <h2>Votre activité mérite<br />un espace à sa mesure.</h2>
        <p>Une expérience premium, pensée pour les entrepreneurs, les équipes et les organisations du monde entier.</p>
      </section>

      <footer><a className="wordmark" href="/"> <span className="mark">O</span> ORVEX</a><span>© {new Date().getFullYear()} ORVEX. Tous droits réservés.</span></footer>
    </main>
  );
}
