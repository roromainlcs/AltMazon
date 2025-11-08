import { useState, useEffect } from 'react';
import InfoIcon from './assets/info.tsx';
import VoteButtons from './score';
import { getAltShopList, addProduct, IAltShop } from './backRequest';
import { useStore } from './viewStore';
import { currencies } from './lib/types'
import './styles/alternativeShops.css';

interface DisplayAltShopListProps {
  defaultUserVotes: { [key: string]: number };
  altShopList: IAltShop[];
  setShowUserNotLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

function getShopName(link: string): string {
  try {
    const url = new URL(link);
    return url.hostname.slice(url.hostname.indexOf('.') + 1);
  } catch {
    console.error("Invalid URL:", link);
    return "Unknown Shop";
  }
}

function DisplayAltShopList({ defaultUserVotes, altShopList, setShowUserNotLoggedIn }: DisplayAltShopListProps) {
  const { userInfo, setView } = useStore();

  return (
    <>
      <div className='shop-list-header'>
        <div>Shop</div>
        <div>Price</div>
        <div>Score</div>
      </div>
      <div className='shop-list'>
        {
          altShopList?.length == 0 && <div>No alternative shops found</div>
          ||
          altShopList.map((shop, index) => (
            <div key={index} className='shop-list-item'>
              <div className="shop-list-item-name"><a href={shop.link} target='_blank' rel='noreferrer' title={shop.link}>{getShopName(shop.link)}</a></div>
              <div className="shop-list-item-price">{shop.price}{currencies.find(c => c.code === shop.currency)?.symbol || '?'}</div>
              <VoteButtons defaultUserVote={defaultUserVotes[shop.id]} initialVotes={shop.score} shopId={shop.id} userId={userInfo?.sub} setShowUserNotLoggedIn={setShowUserNotLoggedIn}/>
            </div>
          ))
        }
      </div>
      <button onClick={() => userInfo?.sub ? setView('addAltShop') : setShowUserNotLoggedIn(true)}>+</button>
    </>
  );
}

export function AltShops() {
  const { itemData, setView } = useStore();
  const [altShopList, setAltShopList] = useState<IAltShop[] | null>(null);
  const [showUserNotLoggedIn, setShowUserNotLoggedIn] = useState<boolean>(false);
  const [warningClassName, setWarningClassName] = useState<string>('user-not-logged-in');
  const [defaultUserVotes, setDefaultUserVotes] = useState<{ [key: string]: number }>({});
  const [errorLoading, setErrorLoading] = useState<string>('');
  
  useEffect(() => {
    async function loadAltShopList() {
      try {
        const { data, votes } = await getAltShopList(itemData.asin);
        //const votes: [] = await getUserVotes(itemData.asin);
        console.log("votes", votes);
        console.log("data", data);
        const votesDict: { [key: string]: number } = votes.reduce((acc, { id, vote }) => {
          acc[id] = vote;
          return acc;
        }, {} as { [key: string]: number });
        setAltShopList(data);
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
      console.log("huhooooo");
      setView('home');
    }
    loadAltShopList();
  }, [itemData, setView]);

  useEffect(() => {
    if (showUserNotLoggedIn) {
      setWarningClassName('user-not-logged-in show-user-not-logged-in');
      setTimeout(() => {
        setShowUserNotLoggedIn(false);
        setWarningClassName('user-not-logged-in');
      }, 3000);
    }
  }, [showUserNotLoggedIn]);

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
          <DisplayAltShopList defaultUserVotes={defaultUserVotes} altShopList={altShopList as IAltShop[]} setShowUserNotLoggedIn={setShowUserNotLoggedIn} />
        }
          <p className={warningClassName} onClick={() => setWarningClassName('user-not-logged-in')}>You need to be logged in to participate :(</p>
      </div>
    </>
  );
}