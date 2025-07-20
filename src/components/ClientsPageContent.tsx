// src/components/ClientsPageContent.tsx
"use client";

import { useState, useMemo } from 'react';
import type { Client, PersonalNetworkContact, JobFile } from '@/types/app-interfaces';
import Link from 'next/link';
import { PlusCircle, Search, Building2, User } from 'lucide-react';
import ClientDetailModal from './ClientDetailModal';

interface ClientsPageContentProps {
    clients: Client[];
    contacts: PersonalNetworkContact[];
    jobFiles: JobFile[];
    userId: string;
}

export default function ClientsPageContent({
    clients = [],
    contacts = [],
    jobFiles = [],
    userId,
}: ClientsPageContentProps) {
    const [filter, setFilter] = useState<'all' | 'companies' | 'contacts'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Client | PersonalNetworkContact | null>(null);
    const [itemType, setItemType] = useState<'Company' | 'Contact'>('Company');
    
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
            const tagMatch = item.type === 'Contact' && Array.isArray((item as PersonalNetworkContact).tags) && (item as PersonalNetworkContact).tags?.some(tag => tag.toLowerCase().includes(searchInput));
            const searchMatch = nameMatch || companyNameMatch || tagMatch;
            return typeMatch && searchMatch;
        }).sort((a, b) => ((b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
    }, [clients, contacts, filter, searchTerm]);

    const handleOpenModal = (item: Client | PersonalNetworkContact, type: 'Company' | 'Contact') => {
        setSelectedItem(item);
        setItemType(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold">Clients & Connections</h1>
                    <div className="flex gap-2">
                        <Link href="/dashboard/clients/new-company" className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"><PlusCircle size={20}/> New Company</Link>
                        <Link href="/dashboard/clients/new-contact" className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700"><PlusCircle size={20}/> New Contact</Link>
                    </div>
                </div>
                <div className="mb-6 p-4 bg-card border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search by Name or Tag</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><input id="search" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-10 p-2 border rounded-md bg-background"/></div></div>
                        <div><label htmlFor="filter" className="block text-sm font-medium text-muted-foreground mb-1">Show</label><select id="filter" value={filter} onChange={e => setFilter(e.target.value as any)} className="w-full p-2 border rounded-md bg-background"><option value="all">All</option><option value="companies">Companies Only</option><option value="contacts">Contacts Only</option></select></div>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredItems.map(item => (
                        <div key={`${item.type}-${item.id}`} onClick={() => handleOpenModal(item, item.type)} className="bg-card p-4 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-muted transition-colors">
                            <div><p className="font-bold text-foreground">{'companyName' in item && item.companyName ? item.companyName : item.name}</p><p className="text-sm text-muted-foreground">{item.email || 'No email provided'}</p></div>
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">{item.type === 'Company' ? <Building2 size={16} /> : <User size={16} />}</div>
                        </div>
                    ))}
                </div>
                {filteredItems.length === 0 && (<div className="text-center py-12 text-muted-foreground"><p>No items match your search or filter.</p></div>)}
            </div>
            {isModalOpen && selectedItem && (
                <ClientDetailModal
                    item={selectedItem}
                    itemType={itemType}
                    userId={userId}
                    clients={clients}
                    jobFiles={jobFiles}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}