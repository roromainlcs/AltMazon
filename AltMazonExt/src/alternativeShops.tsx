import { useState, useEffect } from 'react';
import InfoIcon from './assets/info.tsx';
import VoteButtons from './score';
import { getAltShopList, addProduct } from './backRequest';
import { useStore } from './store.ts';
import { currencies, IAltShop } from './lib/types'
import './styles/alternativeShops.css';

interface DisplayAltShopListProps {
  defaultUserVotes: { [key: string]: number };
}

const Arrow = ({ flipped }: { flipped?: boolean }) => {
  return(
    <svg style={{ transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5L4 15H20L12 5Z" fill="currentColor" />
    </svg>
  );
};

function sortAltShopsByScore(list: IAltShop[] | null | undefined, order: 'asc' | 'desc' = 'asc'): IAltShop[] {
  if (!list || list.length === 0) return [];
  return [...list].sort((a, b) => (order === 'asc' ? a.score - b.score : b.score - a.score));
}

function sortAltShopsByName(list: IAltShop[] | null | undefined, order: 'asc' | 'desc' = 'asc'): IAltShop[] {
  if (!list || list.length === 0) return [];
  return [...list].sort((a, b) => {
    const nameA = getShopName(a.link).toLowerCase();
    const nameB = getShopName(b.link).toLowerCase();
    const cmp = nameA.localeCompare(nameB);
    return order === 'asc' ? cmp : -cmp;
  });
}

function sortAltShopsByPrice(list: IAltShop[] | null | undefined, order: 'asc' | 'desc' = 'asc'): IAltShop[] {
  if (!list || list.length === 0) return [];
  return [...list].sort((a, b) => {
    const pa = typeof a.price === 'number' ? a.price : Number.POSITIVE_INFINITY;
    const pb = typeof b.price === 'number' ? b.price : Number.POSITIVE_INFINITY;
    return order === 'asc' ? pa - pb : pb - pa;
  });
}

function getShopName(link: string): string {
  try {
    const url = new URL(link);
    return url.hostname.slice(url.hostname.indexOf('.') + 1);
  } catch {
    //console.error("Invalid URL:", link);
    return "Unknown Shop";
  }
}

type SortByOption = 'score+' | 'score-' | 'name+' | 'name-' | 'price+' | 'price-';

function DisplayAltShopList({ defaultUserVotes}: DisplayAltShopListProps) {
  const { userInfo, setView, setShowUserNotLoggedIn, altShopList, setAltShopList } = useStore();
  const [sortBy, setSortBy] = useState<SortByOption>('score+');

  function changeAltShopListSortBy(newSortBy: SortByOption) {
    let sortedList;
    console.log("changing sort by to", newSortBy);
    setSortBy(newSortBy);
    switch (newSortBy) {
      case 'score+':
        sortedList = sortAltShopsByScore(altShopList);
        break;
      case 'score-':
        sortedList = sortAltShopsByScore(altShopList, 'desc');
        break;
      case 'name+':
        sortedList = sortAltShopsByName(altShopList);
        break;
      case 'name-':
        sortedList = sortAltShopsByName(altShopList, 'desc');
        break;
      case 'price+':
        sortedList = sortAltShopsByPrice(altShopList);
        break;
      case 'price-':
        sortedList = sortAltShopsByPrice(altShopList, 'desc');
        break;
    }
    setAltShopList(sortedList);
  }

  return (
    <>
      <div className='shop-list-header'>
        <div className='shop-list-header-item' onClick={() => { changeAltShopListSortBy(sortBy === 'name-' ? 'name+' : 'name-') }}><div className='arrow-wrapper'><Arrow flipped={sortBy !== 'name+'} /></div>Shop</div>
        <div className='shop-list-header-item' onClick={() => { changeAltShopListSortBy(sortBy === 'price-' ? 'price+' : 'price-') }}><div className='arrow-wrapper'><Arrow flipped={sortBy !== 'price+'} /></div>Price</div>
        <div className='shop-list-header-item' onClick={() => { changeAltShopListSortBy(sortBy === 'score-' ? 'score+' : 'score-') }}><div className='arrow-wrapper'><Arrow flipped={sortBy !== 'score+'} /></div>Score</div>
      </div>
      <div className='shop-list'>
        {
          (altShopList === null || altShopList?.length === 0)
            ? <div>No alternative shops found</div>
            : (altShopList || []).map((shop) => (
                <div key={shop.id} className='shop-list-item'>
                  <div className="shop-list-item-name"><a href={shop.link} target='_blank' rel='noreferrer' title={shop.link}>{getShopName(shop.link)}</a></div>
                  <div className="shop-list-item-price">{shop.price}{currencies.find(c => c.code === shop.currency)?.symbol || '?'}</div>
                  <VoteButtons defaultUserVote={defaultUserVotes[shop.id]} initialVotes={shop.score} shopId={shop.id}/>
                </div>
              ))
        }
      </div>
      <button className='add-button' onClick={() => userInfo?.sub ? setView('addAltShop') : setShowUserNotLoggedIn(true)}>+</button>
    </>
  );
}

export function AltShops() {
  const { itemData, setView, altShopList, setAltShopList, defaultUserVotes, setDefaultUserVotes, showUserNotLoggedIn, setShowUserNotLoggedIn } = useStore();
  const [warningClassName, setWarningClassName] = useState<string>('user-not-logged-in');
  const [errorLoading, setErrorLoading] = useState<string>('');
  
  useEffect(() => {
    async function loadAltShopList() {
      console.log(altShopList)
      if (altShopList !== null || itemData.asin === '' || itemData.asin === 'none')
        return;
      try {
        const { data, votes } = await getAltShopList(itemData.asin);
        // deprecated: const votes: [] = await getUserVotes(itemData.asin);
        const votesDict: { [key: string]: number } = votes.reduce((acc, { id, vote }) => {
          acc[id] = vote;
          return acc;
        }, {} as { [key: string]: number });
        setAltShopList(sortAltShopsByScore(data, 'asc'));
        setDefaultUserVotes(votesDict);
      } catch (e: unknown) {
        // if product not found, add it to the database
        if (e instanceof Error && e.message === "Product not found") {
          setAltShopList([]);
          try {
            addProduct(itemData.asin, itemData.name, itemData.brandName);
          } catch (e: unknown) {
            console.error("error adding product:", e);
            setErrorLoading("Error creating product");
          }
        } else if (e instanceof Error && e.message == 'Failed to fetch') {
          setErrorLoading("cannot access the server");
          console.error("error loading alt shops:", e.message);
        }
      }
    }
    if (itemData.asin === 'none') {
      console.log("huhooooo");
      setView('home');
    } else if (itemData.asin === '') {
      console.log("hihi");
      setView('home');
    }
    loadAltShopList();
  }, [itemData, setView, altShopList, setAltShopList, setDefaultUserVotes]);

  useEffect(() => {
    if (showUserNotLoggedIn) {
      setWarningClassName('user-not-logged-in show-user-not-logged-in');
      setTimeout(() => {
        setShowUserNotLoggedIn(false);
        setWarningClassName('user-not-logged-in');
      }, 3000);
    }
  }, [showUserNotLoggedIn, setShowUserNotLoggedIn]);

  return (
    <>
      <div className='shop-header'>
        <button className='shop-button' onClick={() => setView('home')}>Go back</button>
        <button className="info-button" onClick={() => setView('info')}><InfoIcon /></button>
        </div>
      <div className='shop-list-wrapper'>
        {
          altShopList == null && errorLoading != '' && <p>{errorLoading}</p>
          ||
          altShopList == null && <p>Loading...</p>
          ||
          <DisplayAltShopList defaultUserVotes={defaultUserVotes}/>
        }
          <p className={warningClassName} onClick={() => setWarningClassName('user-not-logged-in')}>You need to be logged in to participate :(</p>
      </div>
    </>
  );
}