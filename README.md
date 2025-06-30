# StuddyBuddy

Een simpele, volledig responsieve webapp voor scholieren om hun taalvaardigheid op een effectieve manier te oefenen met ingebouwde tijdslimiet functionaliteit voor een gezonde balans tussen leren en ontspannen.
✨ Features

Flexibele woordinvoer: Voer handmatig woorden in, upload een foto van je aantekeningen (coming soon!), of kies uit eerder opgeslagen sets
(coming soon!)
Intelligente foto-herkenning: Upload een A4-foto en de app extraheert automatisch vragen en antwoorden
Studietimer: Stel timers in van 10, 20 of 30 minuten met verplichte pauzes
Real-time feedback: Kleurgecodeerde voortgangsindicator (groen >90%, oranje 50-90%, rood <50%)
Adaptive learning: Vragen worden gehusseld voor optimale memorisatie
Persoonlijke database: Sla woordensets op voor herhaald gebruik
Responsive design: Werkt perfect op desktop, tablet en mobiel

🎯 Doelgroep
Scholieren die hun taalvaardigheid willen verbeteren door middel van vraag-antwoord oefeningen.

🛠️ Tech Stack
Frontend

TypeScript - Type-safe JavaScript
React + Vite - Moderne React development
HTML/CSS - Structuur en styling
Tailwind CSS - Utility-first CSS framework
Netlify - Frontend hosting

Backend

JavaScript - Server-side logic
Node.js - Runtime environment
Express.js - Web application framework
Database - Supabase
Render - Backend hosting

🎨 Design System
Kleurenpalet

Primair: #E077D7 - Hoofdkleur
Secundair: #28AFB0 - Accentkleur
Tertiair: #55C1FF - Ondersteunende kleur
Buttons: #E1DD8F - Knopkleur
Sidebar: #6622CC - Navigatiekleur

Typografie

H1: Lexend Deca - Hoofdkoppen
H2: Roboto Condensed - Subkoppen
Paragrafen: Roboto Mono - Algemene tekst
Antwoorden: Caveat - Speciaal voor goed/fout feedback

📁 Project Structuur
studdybuddy/
├── src/
│ ├── frontend/
│ │ └── componenten/
│ │ ├── Home
│ │ ├── Register
│ │ ├── Login
│ │ ├── Timer
│ │ ├── Contact
│ │ ├── Upload info/
│ │ │ ├── handmatig
│ │ │ ├── uploadFoto
│ │ │ └── kiesUitDatabase
│ │ └── Toets
│ └── backend/
│ ├── database/
│ └── api/

🚀 Componenten Overzicht
Authenticatie

Login: Beveiligde toegang met email/wachtwoord
Register: Accountregistratie met wachtwoordvalidatie (min. 10 tekens, hoofdletter, speciaal teken, cijfer)

Hoofdfunctionaliteit

Home: Dashboard met toegang tot alle functies
Timer: Studietimer met verplichte pauzes voor gezond leren
Toets: Interactieve oefenmodus met real-time feedback

Data Management

Handmatig: Directe invoer van vraag-antwoord paren
Upload Foto: AI-powered tekstherkenning van handgeschreven notities
Database Keuze: Toegang tot persoonlijke woordensets

🎮 Hoe het Werkt

Inloggen/Registreren: Maak een account aan of log in
Woorden Toevoegen:

Typ handmatig in
Upload een foto van je aantekeningen
Kies uit eerder opgeslagen sets

Timer Instellen: Kies 10, 20 of 30 minuten studietijd
Oefenen: Beantwoord vragen met real-time kleurgecodeerde feedback
Resultaten: Bekijk je score en foute antwoorden
Herhalen: Start opnieuw met gehusselde vragen

📱 Responsive Design
Mobile Layout

Hamburger menu met navigatie
Gestapelde kaarten voor overzichtelijkheid
Touch-friendly interface

Desktop Layout

Horizontaal verdeelde content
Uitgebreide navigatie
Optimaal gebruik van schermruimte

🔒 Beveiliging & Privacy

Gebruikers kunnen alleen hun eigen woordensets bekijken en beheren
Veilige wachtwoordvalidatie
Persoonlijke data wordt gekoppeld aan unieke UserID

📞 Contact & Support
Ingebouwde contactformulier voor gebruikersfeedback en ondersteuning (max. 300 woorden).
🔄 Komende Features

Database implementatie (nog te bepalen welke)
Uitgebreide analytics voor leervoortgang
Meer taalondersteuning
Sociale features voor het delen van woordensets

💡 Design Principes

Simpliciteit: Intuïtieve interface zonder onnodige complexiteit
Effectiviteit: Bewezen leermethoden geïmplementeerd in digitale vorm
Balans: Ingebouwde pauzes voor gezond leergedrag
Personalisatie: Aanpasbare content en voortgangstracering

StuddyBuddy - Maak leren leuk en effectief! 📚✨
