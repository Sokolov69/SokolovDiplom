import { User } from '../types/auth';

/**
 * Проверяет, имеет ли пользователь права администратора
 * @param user Объект пользователя
 * @returns true, если пользователь имеет права администратора
 */
export const isAdmin = (user: User | null): boolean => {
    if (!user) return false;
    
    // Проверка highest_role
    if (user.highest_role && (
        user.highest_role.is_staff_role || 
        user.highest_role.is_moderator_role || 
        user.highest_role.is_superuser_role
    )) {
        return true;
    }
    
    // Проверка любой роли в массиве roles
    if (user.roles && user.roles.length > 0) {
        return user.roles.some(role => 
            role.is_staff_role || 
            role.is_moderator_role || 
            role.is_superuser_role
        );
    }
    
    return false;
};

/**
 * Проверяет, имеет ли пользователь права модератора
 * @param user Объект пользователя
 * @returns true, если пользователь имеет права модератора
 */
export const isModerator = (user: User | null): boolean => {
    if (!user) return false;
    
    // Проверка highest_role
    if (user.highest_role && (
        user.highest_role.is_moderator_role || 
        user.highest_role.is_superuser_role
    )) {
        return true;
    }
    
    // Проверка любой роли в массиве roles
    if (user.roles && user.roles.length > 0) {
        return user.roles.some(role => 
            role.is_moderator_role || 
            role.is_superuser_role
        );
    }
    
    return false;
};

/**
 * Проверяет, имеет ли пользователь права суперпользователя
 * @param user Объект пользователя
 * @returns true, если пользователь имеет права суперпользователя
 */
export const isSuperuser = (user: User | null): boolean => {
    if (!user) return false;
    
    // Проверка highest_role
    if (user.highest_role && user.highest_role.is_superuser_role) {
        return true;
    }
    
    // Проверка любой роли в массиве roles
    if (user.roles && user.roles.length > 0) {
        return user.roles.some(role => role.is_superuser_role);
    }
    
    return false;
}; 