export interface Agent {
    _id: { $oid: string };
    agent_name: string;
    source_name: string;
    source_cnic_number?: string;
    source_cnic_attachment?: string;
    slip_number?: string;
    slip_attachment?: string;
    mobile_number: string;
    description?: string;
    amount_paid?: number;
    created_at?: { $date: number }; // MongoEngine might return date object
    updated_at?: { $date: number };
}
