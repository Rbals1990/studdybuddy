# 📚 StuddyBuddy

**StuddyBuddy** is een volledig responsive webapp voor scholieren om hun taalvaardigheid op een makkelijke, doeltreffende én leuke manier te oefenen. De app biedt een interactieve omgeving waarin leerlingen zelf woordenlijsten kunnen invoeren of uploaden, toetsen kunnen maken met directe feedback, en een studietimer kunnen gebruiken voor een gebalanceerde leerervaring.

---

## 🎯 Doel

Een toegankelijke, gebruiksvriendelijke tool waarmee leerlingen effectief hun woordenschat kunnen trainen in o.a. Nederlands en Engels. Door een tijdslimiet in te stellen en via het stoplichtprincipe feedback te krijgen, blijft leren behapbaar en motiverend.

---

## 🚀 Functionaliteiten

- Oefenen van eigen woordenlijsten
- Uploaden van foto's met woorden (OCR extractie)
- Studietimer (10, 20 of 30 min) met pauzemelding inclusief geluid
- Feedback per antwoord (groen/oranje/rood)
- Opslaan van woordenparen in persoonlijke database
- Oefeningen worden omgedraaid na afloop voor verdieping
- Score-overzicht en eindcijfer
- Herhalen of afsluiten na elke oefening

---

## 🖼️ Layout & Navigatie

### ✅ **BasicLayout** (Login, Register, Contact, Upload, Toets)

- Logo gecentreerd bovenin
- Volledige scherminhoud van component

### 🏠 **HomeLayout** (Homepagina)

- **Mobile**: Hamburger menu, kaarten onder elkaar
- **Desktop**: Hamburger menu, 3 kaarten horizontaal gecentreerd
- Opties: Handmatig toevoegen, Foto uploaden, Database kiezen

---

## 🧩 Componenten

- **Login & Register**: Validatie van sterke wachtwoorden, gebruikersbeheer met unieke UserID
- **Homepagina**: Kiezen uit manieren om woorden toe te voegen + toegang tot timer
- **Timer**: Aftellende timer met pauzemelding en klikvertraging
- **Contactformulier**: Verstuurbare feedback tot 300 woorden
- **Handmatig**: Zelf vragen/antwoorden invoeren & opslaan
- **UploadFoto**: OCR op foto → automatische invoer
- **KiesDatabase**: Persoonlijke lijst met opgeslagen paren, scores & bewerkopties
- **Toets**: Vraag/antwoord met kleurscores + omgedraaide toetsronde

---

## 🛠️ Technische Stack

### 💻 Frontend

- React (+ Vite)
- TypeScript
- HTML, Tailwind CSS
- Hosting: Netlify

### 🌐 Backend

- Node.js, Express.js
- Supabase
- Hosting: Render

---

## 🎨 Design

### Kleurenpalet

| Element   | Kleur     |
| --------- | --------- |
| Primair   | `#E077D`  |
| Secundair | `#28AFB0` |
| Tertiair  | `#55C1FF` |
| Buttons   | `#E1DD8F` |
| Sidebar   | `#6622CC` |

### Fonts

- **H1**: Lexend Deca
- **H2**: Roboto Condensed
- **Paragrafen**: Roboto Mono
- **Feedbacktekst**: Caveat

---

## 📦 Features to add (Toekomstige verbeteringen)

- Meertalige ondersteuning uitbreiden
- Uitbreiding timeropties op verzoek
- Analytics per gebruiker (voortgang)
- OCR optimaliseren voor verschillende formaten
- Wachtwoord reset functie

---

## 🤝 Contact

Voor vragen of suggesties, gebruik het contactformulier binnen de app of stuur een e-mail via de appinterface.

---
