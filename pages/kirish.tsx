import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AccessGate from '../components/AccessGate';

export default function KirishPage() {
  const router = useRouter();

  function handleDone() {
    const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/';
    router.push(redirect);
  }

  return (
    <Layout backHref="/">
      <AccessGate onDone={handleDone} />
    </Layout>
  );
}
