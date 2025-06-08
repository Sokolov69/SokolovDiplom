import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import { isAdmin, isModerator, isSuperuser } from '../utils/permissions';

export const useAppDispatch = () => useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Хуки для проверки разрешений пользователя
export const useIsAdmin = (): boolean => {
    const { user } = useAppSelector((state) => state.auth);
    return isAdmin(user);
};

export const useIsModerator = (): boolean => {
    const { user } = useAppSelector((state) => state.auth);
    return isModerator(user);
};

export const useIsSuperuser = (): boolean => {
    const { user } = useAppSelector((state) => state.auth);
    return isSuperuser(user);
}; 