export interface TransportRoute {
    transport_from: string;
    transport_to: string;
}

export interface Transport {
    status: 'Yes' | 'No';
    routes: TransportRoute[];
}

export interface Ticket {
    status: 'Yes' | 'No';
    ticket_type?: 'Direct' | 'Indirect';
}

export interface Ziarat {
    status: 'Yes' | 'No';
    major_ziarat?: string[];
    ziarat_count?: number;
}

export interface Moaleem {
    status: 'Yes' | 'No';
    moaleem_name?: string;
    moaleem_contact?: string;
}

export interface Umrahs {
    status: 'Yes' | 'No';
    umrahs_count?: number;
}

export interface Facility {
    _id?: string;
    agencyId?: string;

    hotel: 'Yes' | 'No';
    visa: 'Yes' | 'No';
    food: 'Yes' | 'No';
    medical: 'Yes' | 'No';

    transport: Transport;
    ticket: Ticket;
    ziarat: Ziarat;
    moaleem: Moaleem;
    umrahs: Umrahs;

    createdAt?: string;
    updatedAt?: string;
}

export const initialFacilityState: Omit<Facility, '_id' | 'agencyId' | 'createdAt' | 'updatedAt'> = {
    hotel: 'No',
    visa: 'No',
    food: 'No',
    medical: 'No',
    transport: { status: 'No', routes: [] },
    ticket: { status: 'No', ticket_type: 'Direct' },
    ziarat: { status: 'No', major_ziarat: [], ziarat_count: 0 },
    moaleem: { status: 'No', moaleem_name: '', moaleem_contact: '' },
    umrahs: { status: 'No', umrahs_count: 0 }
};
