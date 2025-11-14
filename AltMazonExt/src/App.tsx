import { useEffect } from 'react'
import { getItemData } from './getItemData'
import { AltShops } from './alternativeShops'
import { Info } from './info'
import { AddAltShop } from './addAltShop'
import { getUserInfo, IUserInfo, googleLogin } from './googleLogin'
import './styles/App.css'
import SignOutIcon from './assets/signout'
import { useStore } from './store'

function App() {
  const { view, itemData, setItemData, setUserInfo, setView } = useStore();

  useEffect(() => {
    chrome.storage.local.get("view").then((result) => {
      if (result.view) {
        setView(result.view);
        chrome.storage.local.remove("view");
      }
    });
  }, [setView]);

  useEffect(() => {
    if (process.env.NODE_ENV == "development") {
      setItemData({
        name: "Advanced Clinicals Vitamin C, Advanced Brightening Cream, 16 oz (454 g)",
        brandName: "Advanced Clinicals",
        asin: "B01AMOTPI6",
      });
    } else
      getItemData().then((data) => setItemData(data));
    try {
      getUserInfo().then((data) => {setUserInfo(data)});
    } catch (error) {
      console.error(`error:`, error)
    }
  }, [setUserInfo, setItemData]);

  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  useEffect(() => {
    if (localStorage.getItem('codeAuthData'))
      googleLogin(setUserInfo);
  }, [setUserInfo]);

    return (
      <>
      {view === 'home' && <Home />}
      {(view === 'altShops' && itemData != null) && <AltShops />}
      {view === 'addAltShop' && <AddAltShop />}
      {view === 'info' && <Info />}
    </>
  )};

function Home() {
  const { itemData, userInfo, setView, setUserInfo } = useStore();

  if (itemData.brandName == '') {
    return (
      <div className="main-no-data">
        <p>Can't load data from outside Amazon...</p>
      </div>
    );
  }

  if (itemData.brandName == 'none' && itemData.name == 'none') {
    return (
      <div className="main-no-data">
        <p>No product found on this page</p>
      </div>
    );
  }

  return(
    <>
      <p className="pres-text">No shops listed ?<br/>click the links to search by name or brand (edit if needed).</p>
      <p>Name: <a target="_blank" href={`https://www.google.com/search?q=${itemData.name} -amazon.*`}>{itemData.name}</a></p>
      <p>Brand:  <a target="_blank" href={`https://www.google.com/search?q=${itemData.brandName} -amazon.*`}>{itemData.brandName}</a></p>
      <p>ASIN:  <a target="_blank" href={`https://www.google.com/search?q=${itemData.asin} -amazon.*`}>{itemData.asin}</a></p>
      <div className='footer-wrapper'>
        <button className='shop-button' onClick={() => setView('altShops')}>See other shops</button>
        {
          userInfo && userLoggedIn(userInfo)
        ||
          <button className='shop-button' onClick={() => googleLogin(setUserInfo)}>login</button>
        }
      </div>
    </>
  )
}

function signOut() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("expires_at");
  localStorage.removeItem("refresh_token");
  window.location.reload();
}

function userLoggedIn(userInfo: IUserInfo) {
  return (
    <div className="profile-wrapper" onClick={signOut}>
      <img src={userInfo.picture} className="profile-picture" />
      <div className="signout-icon">
        <SignOutIcon />
      </div>
      <div className='signout-text'>Sign out</div>
    </div>
  )
}

export default App