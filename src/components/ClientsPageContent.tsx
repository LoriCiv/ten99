"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import { getClients, getPersonalNetwork, getJobFiles } from '@/utils/firestoreService';
import Link from 'next/link';
import { Search, Building2, User } from 'lucide-react';
import ClientDetailModal from './ClientDetailModal';

// ✅ 1. Add the props interface
interface ClientsPageContentProps {
    userId: string;
}

export default function ClientsPageContent({ userId }: ClientsPageContentProps) { // ✅ 2. Receive userId
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [contacts, setContacts] = useState<PersonalNetworkContact[]>([]);
    const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'companies' | 'contacts'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Client | PersonalNetworkContact | null>(null);
    const [itemType, setItemType] = useState<'Company' | 'Contact'>('Company');

    // ✅ 3. Move all data fetching logic here and use the real userId
    useEffect(() => {
        setIsLoading(true);
        const unsubClients = getClients(userId, setClients);
        const unsubContacts = getPersonalNetwork(userId, setContacts);
        const unsubJobFiles = getJobFiles(userId, (data) => {
            setJobFiles(data);
            setIsLoading(false); 
        });

        return () => {
            unsubClients();
            unsubContacts();
            unsubJobFiles();
        };
    }, [userId]);

    const filteredItems = useMemo(() => {
        const allItems = [
            ...clients.map(c => ({ ...c, type: 'Company' as const })),
            ...contacts.map(c => ({ ...c, type: 'Contact' as const }))
        ];

        return allItems.filter(item => {
            const typeMatch = filter === 'all' || (filter === 'companies' && item.type === 'Company') || (filter === 'contacts' && item.type === 'Contact');
            if (!searchTerm) { return typeMatch; }
            const searchInput = searchTerm.toLowerCase();
            const nameMatch = (item.name || '').toLowerCase().includes(searchInput);
            const companyNameMatch = 'companyName' in item && (item.companyName || '').toLowerCase().includes(searchInput);
            const tagMatch = item.type === 'Contact' && Array.isArray((item as PersonalNetworkContact).tags) && (item as PersonalNetworkContact).tags?.some((tag: string) => tag.toLowerCase().includes(searchInput));
            return typeMatch && (nameMatch || companyNameMatch || tagMatch);
        });
    }, [clients, contacts, filter, searchTerm]);

    const handleItemClick = (item: Client | PersonalNetworkContact, type: 'Company' | 'Contact') => {
        setSelectedItem(item);
        setItemType(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleDataChanged = () => {
        router.refresh();
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Clients & Connections</h1>
                        <p className="text-muted-foreground mt-1">Manage your business clients and personal network.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/clients/new-contact" className="flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-secondary/80">
                            <User size={20} /> New Contact
                        </Link>
                        <Link href="/dashboard/clients/new-company" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90">
                            <Building2 size={20} /> New Company
                        </Link>
                    </div>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input type="text" placeholder="Search by name, company, or tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 p-2 border rounded-md bg-background"/>
                        </div>
                        <div className="flex items-center gap-2 bg-background p-1 rounded-lg border">
                            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                            <button onClick={() => setFilter('companies')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${filter === 'companies' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Companies</button>
                            <button onClick={() => setFilter('contacts')} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${filter === 'contacts' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Contacts</button>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={`${item.type}-${item.id}`} onClick={() => handleItemClick(item, item.type)} className="bg-card p-4 rounded-lg border hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="bg-secondary p-3 rounded-lg">
                                    {item.type === 'Company'
                                        ? <Building2 className="h-6 w-6 text-secondary-foreground" />
                                        : <User className="h-6 w-6 text-secondary-foreground" />
                                    }
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground truncate">{item.type === 'Company' ? (item as Client).companyName : item.name}</h3>
                                    <p className="text-muted-foreground text-sm truncate">{item.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <ClientDetailModal
                    item={selectedItem}
                    itemType={itemType}
                    userId={userId}
                    clients={clients}
                    jobFiles={jobFiles}
                    onClose={handleCloseModal}
                    onSave={handleDataChanged}
                />
            )}
        </>
    );
}