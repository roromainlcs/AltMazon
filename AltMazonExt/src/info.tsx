import { useStore } from './viewStore';

export function Info() {
  const { setView } = useStore();

  return (
    <div>
      <button className='shop-button' onClick={() => setView('altShops')}>Go back</button>
      Info
    </div>
  );
}