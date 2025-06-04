import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        redirect: '/generator'
    },
    {
        path: '/generator',
        name: 'generator',
        component: () => import('../views/GeneratorView.vue')
    },
    {
        path: '/shared/:uniqueId',
        name: 'shared-map',
        component: () => import('../views/SharedMapView.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router; 