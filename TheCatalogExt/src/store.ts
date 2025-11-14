import { create } from 'zustand';

import { IItemData } from './getItemData'
import { IUserInfo } from './googleLogin'
import { IAltShop } from './lib/types'
export type View = 'home' | 'altShops' | 'addAltShop' | 'info';

export type Store = {
  view: View;
  setView: (view: View) => void;
  itemData: IItemData;
  setItemData: (itemData: IItemData) => void;
  userInfo: IUserInfo | undefined;
  setUserInfo: (userInfo: IUserInfo | undefined) => void;
  altShopList: IAltShop[] | null;
  setAltShopList: (altShopList: IAltShop[] | null) => void;
  defaultUserVotes: { [key: string]: number };
  setDefaultUserVotes: (defaultUserVotes: { [key: string]: number }) => void;
  showUserNotLoggedIn: boolean;
  setShowUserNotLoggedIn: (show: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  view: localStorage.getItem('view') as View || 'home',
  setView: (view: View) => set({ view }),
  itemData: { name: '', brandName: '', asin: '' },
  setItemData: (itemData: IItemData) => set({ itemData }),
  userInfo: undefined,
  setUserInfo: (userInfo: IUserInfo | undefined) => set({ userInfo }),
  altShopList: null,
  setAltShopList: (altShopList: IAltShop[] | null) => set({ altShopList }),
  defaultUserVotes: {},
  setDefaultUserVotes: (defaultUserVotes: { [key: string]: number }) => set({ defaultUserVotes }),
  showUserNotLoggedIn: false,
  setShowUserNotLoggedIn: (show: boolean) => set({ showUserNotLoggedIn: show }),
}));