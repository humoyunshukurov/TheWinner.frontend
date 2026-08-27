import Layout from '../components/Layout';
import { IconGlobe } from '../components/icons';

const PORTFOLIO_URL = 'https://partfolio-black.vercel.app';

// Sidebar's "About me" endi shu yerga - ilova ichida qolib, tashqi
// portfolioga havola beradi (to'g'ridan-to'g'ri sidebar linkini tashqariga
// yo'naltirish o'rniga, avvalgi izohda aytilganidek).
export default function AboutPage() {
  return (
    <Layout title="Men haqimda">
      <div className="game-hero">
        <div className="game-card">
          <div className="game-icon-badge" style={{ cursor: 'default' }}>
            <IconGlobe size={26} />
          </div>
          <h3>Humoyun Shukurov</h3>
          <p className="muted">
            Ushbu platformani ishlab chiqqan fullstack dasturchi haqida ko&apos;proq maʼlumot - loyihalar,
            ko&apos;nikmalar va bog&apos;lanish uchun portfoliomga o&apos;ting.
          </p>
          <a className="pill-btn primary" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6 }}>
            Portfolioga o&apos;tish ↗
          </a>
        </div>
      </div>
    </Layout>
  );
}
