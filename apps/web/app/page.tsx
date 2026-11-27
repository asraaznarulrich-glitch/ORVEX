"use client";

import { useState } from "react";

const nav = [
  { group: "ESPACE DE TRAVAIL", items: [{ id: "overview", label: "Vue d'ensemble", icon: "◫" }, { id: "clients", label: "Clients & prospects", icon: "♧" }, { id: "payments", label: "Paiements", icon: "↗" }] },
  { group: "DÉVELOPPEMENT", items: [{ id: "learning", label: "Formations", icon: "▤" }, { id: "content", label: "Studio de contenu", icon: "✳" }, { id: "ai", label: "Assistants IA", icon: "✧" }] },
  { group: "ORGANISATION", items: [{ id: "team", label: "Équipe & espaces", icon: "⌘" }, { id: "settings", label: "Paramètres", icon: "⚙" }] },
];
const modules = [
  ["clients","Clients & prospects","Centralisez vos contacts et opportunités.","CRM"],
  ["payments","Paiements & rappels","Suivez les règlements et les échéances.","FINANCE"],
  ["learning","Formations & certificats","Créez des parcours et suivez les apprenants.","LEARNING"],
  ["content","Studio de contenu","Préparez vos contenus et vos guides.","STUDIO"],
  ["ai","Assistants IA","Accélérez vos tâches avec des assistants spécialisés.","INTELLIGENCE"],
  ["team","Espaces de travail","Organisez vos projets et vos collaborateurs.","COLLABORATION"],
];
export default function HomePage() {
  const [active, setActive] = useState("overview");
  const [language, setLanguage] = useState("FR");
  const [notice, setNotice] = useState("Bienvenue dans l'aperçu de votre espace ORVEX.");
  const title = active === "overview" ? "Vue d'ensemble" : [...nav.flatMap(g => g.items), ...modules.map(m => ({id:m[0],label:m[1]}))].find(x => x.id === active)?.label ?? "Espace ORVEX";
  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark">O</span><span>ORVEX<small>BUSINESS OS</small></span></a>
      <button className="workspace-switch" onClick={() => setNotice("La gestion multi-espaces sera activée dans une prochaine étape.")}><span className="workspace-avatar">W</span><span>Mon espace<small>Espace de démonstration</small></span><b>⌄</b></button>
      {nav.map(group => <div className="nav-group" key={group.group}><p>{group.group}</p>{group.items.map(item => <button key={item.id} className={active === item.id ? "nav-item active" : "nav-item"} onClick={() => setActive(item.id)}><span>{item.icon}</span>{item.label}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="plan-card"><span className="plan-label">VOTRE FORMULE</span><strong>Découverte</strong><p>Explorez les possibilités d'ORVEX.</p><button onClick={() => setNotice("Les offres et quotas seront configurés lors de la mise en place de la facturation.")}>Voir les offres ↗</button></div><div className="profile"><span className="profile-avatar">U</span><span>Utilisateur ORVEX<small>Compte de démonstration</small></span><b>•••</b></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div className="breadcrumb">ORVEX <span>/</span> {title}</div><div className="top-actions"><span className="demo-pill"><i/> MODE DÉMO</span><button className="icon-button" aria-label="Notifications" onClick={() => setNotice("Vous n'avez aucune notification pour le moment.")}>♧</button><button className="language-button" onClick={() => setLanguage(language === "FR" ? "EN" : "FR")}>{language}⌄</button></div></header>
      <div className="content">
        <div className="welcome-row"><div><p className="eyebrow">VENDREDI 27 NOVEMBRE 2026</p><h1>{active === "overview" ? "Bonjour et bienvenue." : title}</h1><p className="subheading">{active === "overview" ? "Voici un aperçu de votre activité et de vos outils." : "Cet espace est en préparation. Les fonctionnalités seront activées progressivement."}</p></div><button className="primary-action" onClick={() => setNotice("Les actions de création seront disponibles avec les premiers modules connectés.")}>＋ <span>Nouvelle action</span></button></div>
        <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>
        {active === "overview" ? <>
          <div className="stats-grid"><article className="stat-card"><span>CHIFFRE D'AFFAIRES</span><strong>—</strong><small>En attente de connexion des paiements</small></article><article className="stat-card"><span>CLIENTS</span><strong>—</strong><small>Votre portefeuille apparaîtra ici</small></article><article className="stat-card"><span>PROSPECTS</span><strong>—</strong><small>Suivez vos opportunités à venir</small></article><article className="stat-card"><span>FORMATIONS ACTIVES</span><strong>—</strong><small>Gérez vos contenus pédagogiques</small></article></div>
          <div className="section-title"><div><h2>Votre espace ORVEX</h2><p>Les premiers modules de votre environnement de travail.</p></div><span className="section-count">6 MODULES PRÉSENTÉS</span></div>
          <div className="module-grid">{modules.map((m,i)=><button className="module-card" key={m[0]} onClick={()=>setActive(m[0])}><span className="module-icon">{["♧","↗","▤","✳","✧","⌘"][i]}</span><span className="module-tag">{m[3]}</span><strong>{m[1]}</strong><p>{m[2]}</p><span className="module-open">Explorer l'espace <b>↗</b></span></button>)}</div>
          <div className="bottom-panel"><div><span className="spark">✧</span><div><strong>ORVEX évolue avec votre activité.</strong><p>Une plateforme, des outils connectés et une expérience unifiée.</p></div></div><span className="coming-soon">CONSTRUCTION EN COURS</span></div>
        </> : <div className="empty-state"><span className="empty-icon">✧</span><h2>{title}</h2><p>Ce module fait partie de la vision ORVEX. Son interface et ses fonctionnalités seront développées et connectées étape par étape.</p><button onClick={() => setActive("overview")}>Retour à la vue d'ensemble</button></div>}
        <footer className="app-footer"><span>© 2026 ORVEX</span><span>YOUR ENTIRE BUSINESS. ONE SPACE.</span><span>APERÇU DE CONSTRUCTION · V0.2</span></footer>
      </div>
    </section>
  </main>;
}