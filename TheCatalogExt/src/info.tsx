import { useStore } from './store';

export function Info() {
  const { setView } = useStore();

  return (
    <div>
      <button className='shop-button' onClick={() => setView('altShops')}>Go back</button>
      <div className='info-content'>
        <h2>How it works</h2>
        <p>hover the shop name to see the full link, you can upvote a shop if it is a good alternative or downvote it if it is  not. you need to be connected through google login to participate</p>
        <h2>Disclaimer</h2>
        <p>The Catalog is community based which means all alternative shops here are added by other users, TheCatalog does not hold responsibility for what happens once you click on a link</p>
      </div>
    </div>
  );
}