import {Header} from '@/components/Header';

const links = [{url: '/', label: 'Home'}];
export default async function Home() {
  return (
    <>
      <Header links={links} target="Other Page" />
      <div>Is a general page Hermoinie</div>
    </>
  );
}
