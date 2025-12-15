import api from './api';

export interface Invite {
    id?: string;
    email: string;
    token?: string;
    invite_link?: string;
    expires_at?: string;
    is_used?: boolean;
    created_at?: string;
    send_email: boolean;
    email_sent?: boolean;
    email_error?: string;
}

export const invitesApi = {
    create: async (data: { email: string; send_email: boolean }) => {
        const response = await api.post<Invite>('/invites/', data);
        return response.data;
    },

    validate: async (token: string) => {
        const response = await api.get<Invite>(`/invites/validate`, { params: { token } });
        return response.data;
    },

    getAll: async () => {
        const response = await api.get<Invite[]>('/invites/');
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/invites/${id}`);
    }
};
