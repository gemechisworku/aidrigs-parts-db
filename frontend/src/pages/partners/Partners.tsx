import React, { useState, useEffect } from 'react';
import { partnersAPI, Partner, PartnerCreate, Contact, ContactCreate } from '../../services/partnersApi';
import { countriesAPI, Country } from '../../services/countriesApi';

const Partners: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // Form data
    const [formData, setFormData] = useState<PartnerCreate>({
        code: '',
        name: '',
        street_number: '',
        city: '',
        country: '',
        type: undefined
    });

    const [contactForm, setContactForm] = useState<ContactCreate>({
        partner_id: '',
        full_name: '',
        job_title: '',
        email: '',
        phone1: '',
        phone2: ''
    });

    // Contacts state
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadCountries();
    }, []);

    useEffect(() => {
        loadPartners();
    }, [page, searchTerm, filterType]);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await partnersAPI.getPartners(searchTerm || undefined, filterType || undefined, page * pageSize, pageSize);
            setPartners(data);
            setHasMore(data.length === pageSize);
        } catch (error) {
            console.error('Error loading partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCountries = async () => {
        try {
            const data = await countriesAPI.getCountries();
            setCountries(data);
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    };

    const loadContacts = async (partnerId: string) => {
        setLoadingContacts(true);
        try {
            const data = await partnersAPI.getContacts(partnerId);
            setContacts(data);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const openDetailsView = (partnerId: string) => {
        setSelectedPartner(partnerId);
        loadContacts(partnerId);
    };

    const openAddModal = () => {
        setEditingPartner(null);
        setFormData({
            code: '',
            name: '',
            street_number: '',
            city: '',
            country: '',
            type: undefined
        });
        setShowModal(true);
    };

    const openEditModal = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData({
            code: partner.code,
            name: partner.name,
            street_number: partner.street_number,
            city: partner.city,
            country: partner.country,
            type: partner.type
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPartner(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingPartner) {
                await partnersAPI.updatePartner(editingPartner.id, formData);
            } else {
                await partnersAPI.createPartner(formData);
            }
            await loadPartners();
            closeModal();
        } catch (error: any) {
            console.error('Error saving partner:', error);
            alert(error.response?.data?.detail || 'Failed to save partner');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (partner: Partner) => {
        if (!confirm(`Are you sure you want to delete partner "${partner.name}"?`)) return;

        setLoading(true);
        try {
            await partnersAPI.deletePartner(partner.id);
            if (selectedPartner === partner.id) {
                setSelectedPartner(null);
            }
            await loadPartners();
        } catch (error: any) {
            console.error('Error deleting partner:', error);
            alert(error.response?.data?.detail || 'Failed to delete partner');
        } finally {
            setLoading(false);
        }
    };

    const openAddContactModal = () => {
        if (!selectedPartner) return;
        setEditingContact(null);
        setContactForm({
            partner_id: selectedPartner,
            full_name: '',
            job_title: '',
            email: '',
            phone1: '',
            phone2: ''
        });
        setShowContactModal(true);
    };

    const openEditContactModal = (contact: Contact) => {
        setEditingContact(contact);
        setContactForm({
            partner_id: contact.partner_id,
            full_name: contact.full_name || '',
            job_title: contact.job_title || '',
            email: contact.email || '',
            phone1: contact.phone1 || '',
            phone2: contact.phone2 || ''
        });
        setShowContactModal(true);
    };

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPartner) return;

        setLoading(true);
        try {
            if (editingContact) {
                await partnersAPI.updateContact(editingContact.id, contactForm);
            } else {
                await partnersAPI.createContact(contactForm);
            }
            await loadContacts(selectedPartner);
            setShowContactModal(false);
        } catch (error: any) {
            console.error('Error adding contact:', error);
            alert(error.response?.data?.detail || 'Failed to add contact');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        setLoading(true);
        try {
            await partnersAPI.deleteContact(contactId);
            if (selectedPartner) {
                await loadContacts(selectedPartner);
            }
        } catch (error: any) {
            console.error('Error deleting contact:', error);
            alert(error.response?.data?.detail || 'Failed to delete contact');
        } finally {
            setLoading(false);
        }
    };

    const getPartnerTypeBadge = (type?: string) => {
        const colors: Record<string, string> = {
            supplier: 'bg-blue-100 text-blue-800',
            customer: 'bg-green-100 text-green-800',
            AR_storage: 'bg-purple-100 text-purple-800',
            forwarder: 'bg-orange-100 text-orange-800'
        };

        const labels: Record<string, string> = {
            supplier: 'Supplier',
            customer: 'Customer',
            AR_storage: 'AR Storage',
            forwarder: 'Forwarder'
        };

        if (!type) return null;

        return (
            <span className={`text-xs px-2 py-1 rounded-full ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
                {labels[type] || type}
            </span>
        );
    };

    const selectedPartnerData = partners.find(p => p.id === selectedPartner);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Partners Management</h1>
                    <p className="text-gray-600">Manage suppliers, customers, forwarders, and AR storage partners</p>
                </div>
                <button onClick={openAddModal} className="btn-primary">
                    + Add Partner
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] h-auto">
                {/* Left Panel - Partners List */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <input
                            type="text"
                            placeholder="Search partners..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                            className="input mb-3"
                        />
                        <select
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
                            className="input"
                        >
                            <option value="">All Types</option>
                            <option value="supplier">Supplier</option>
                            <option value="customer">Customer</option>
                            <option value="AR_storage">AR Storage</option>
                            <option value="forwarder">Forwarder</option>
                        </select>
                    </div>

                    {/* Partners List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-semibold text-gray-700">Partners List</h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Loading...</div>
                            ) : partners.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No partners found</p>
                                    <button onClick={openAddModal} className="text-indigo-600 hover:text-indigo-900 text-sm mt-2">
                                        + Add your first partner
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {partners.map((partner) => (
                                        <div
                                            key={partner.id}
                                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${selectedPartner === partner.id
                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                                                }`}
                                            onClick={() => openDetailsView(partner.id)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h3 className={`font-semibold ${selectedPartner === partner.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {partner.name || 'Unnamed Partner'}
                                                    </h3>
                                                    {partner.code && <p className="text-xs text-gray-500 font-mono">{partner.code}</p>}
                                                </div>
                                                {getPartnerTypeBadge(partner.type)}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {partner.city && partner.country ? (
                                                    <span>{partner.city}, {partner.country}</span>
                                                ) : partner.city || partner.country || (
                                                    <span className="italic">No location</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                                className="text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-500">Page {page + 1}</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!hasMore || loading}
                                className="text-sm text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Partner Details */}
                <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {selectedPartnerData ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedPartnerData.name || 'Unnamed Partner'}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        {selectedPartnerData.code && (
                                            <span className="text-sm font-mono bg-gray-200 px-2 py-0.5 rounded text-gray-700">
                                                {selectedPartnerData.code}
                                            </span>
                                        )}
                                        {getPartnerTypeBadge(selectedPartnerData.type)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(selectedPartnerData)}
                                        className="btn-secondary text-sm py-2 px-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedPartnerData)}
                                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Partner Information */}
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Location Details</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-6">
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Street Number</span>
                                            <p className="font-medium text-gray-900">{selectedPartnerData.street_number || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase block mb-1">City</span>
                                            <p className="font-medium text-gray-900">{selectedPartnerData.city || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Country</span>
                                            <p className="font-medium text-gray-900">{selectedPartnerData.country || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contacts Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contacts</h3>
                                        <button
                                            onClick={openAddContactModal}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Contact
                                        </button>
                                    </div>

                                    {loadingContacts ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : contacts.length > 0 ? (
                                        <div className="space-y-3">
                                            {contacts.map((contact) => {
                                                const isExpanded = expandedContacts.has(contact.id);
                                                return (
                                                    <div key={contact.id} className="border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-sm bg-white">
                                                        <div
                                                            className="p-4 cursor-pointer flex justify-between items-center"
                                                            onClick={() => {
                                                                const newExpanded = new Set(expandedContacts);
                                                                if (isExpanded) {
                                                                    newExpanded.delete(contact.id);
                                                                } else {
                                                                    newExpanded.add(contact.id);
                                                                }
                                                                setExpandedContacts(newExpanded);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                                    {contact.full_name ? contact.full_name.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900">{contact.full_name || 'Unnamed Contact'}</h4>
                                                                    {contact.job_title && <p className="text-xs text-gray-500">{contact.job_title}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); openEditContactModal(contact); }}
                                                                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                                    title="Edit Contact"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                                    title="Delete Contact"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                                <svg
                                                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                                                                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                                                    {contact.email && (
                                                                        <div className="flex items-start gap-2">
                                                                            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                            </svg>
                                                                            <div>
                                                                                <span className="text-xs font-medium text-gray-500 block">Email</span>
                                                                                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {contact.phone1 && (
                                                                        <div className="flex items-start gap-2">
                                                                            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                            </svg>
                                                                            <div>
                                                                                <span className="text-xs font-medium text-gray-500 block">Phone 1</span>
                                                                                <a href={`tel:${contact.phone1}`} className="text-gray-900 hover:text-blue-600">{contact.phone1}</a>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {contact.phone2 && (
                                                                        <div className="flex items-start gap-2">
                                                                            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                            </svg>
                                                                            <div>
                                                                                <span className="text-xs font-medium text-gray-500 block">Phone 2</span>
                                                                                <a href={`tel:${contact.phone2}`} className="text-gray-900 hover:text-blue-600">{contact.phone2}</a>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            <p className="text-sm text-gray-500 italic">No contacts added yet</p>
                                            <button onClick={openAddContactModal} className="text-xs text-blue-600 hover:underline mt-1">
                                                Add a contact
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-500">Select a partner</p>
                            <p className="text-sm">Click on a partner from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Partner Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingPartner ? 'Edit Partner' : 'Add Partner'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Partner Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="input"
                                        placeholder="SUP001"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">Partner Type <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="input"
                                        required
                                    >
                                        <option value="">Select type...</option>
                                        <option value="supplier">Supplier</option>
                                        <option value="customer">Customer</option>
                                        <option value="AR_storage">AR Storage</option>
                                        <option value="forwarder">Forwarder</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="label">Name</label>
                                    <input
                                        type="text"
                                        maxLength={60}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        placeholder="Company Name"
                                    />
                                </div>

                                <div>
                                    <label className="label">Street Number</label>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        value={formData.street_number}
                                        onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                                        className="input"
                                        placeholder="123"
                                    />
                                </div>

                                <div>
                                    <label className="label">City</label>
                                    <input
                                        type="text"
                                        maxLength={60}
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="input"
                                        placeholder="New York"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="label">Country</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">Select country...</option>
                                        {countries.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Saving...' : editingPartner ? 'Save Changes' : 'Create Partner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{editingContact ? 'Edit Contact' : 'Add Contact'}</h2>
                            <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddContact} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input
                                        type="text"
                                        maxLength={60}
                                        value={contactForm.full_name}
                                        onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                                        className="input"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="label">Job Title</label>
                                    <input
                                        type="text"
                                        maxLength={60}
                                        value={contactForm.job_title}
                                        onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                                        className="input"
                                        placeholder="Sales Manager"
                                    />
                                </div>

                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        maxLength={60}
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        className="input"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Phone 1</label>
                                        <input
                                            type="tel"
                                            maxLength={12}
                                            value={contactForm.phone1}
                                            onChange={(e) => setContactForm({ ...contactForm, phone1: e.target.value })}
                                            className="input"
                                            placeholder="+1234567890"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Phone 2</label>
                                        <input
                                            type="tel"
                                            maxLength={12}
                                            value={contactForm.phone2}
                                            onChange={(e) => setContactForm({ ...contactForm, phone2: e.target.value })}
                                            className="input"
                                            placeholder="+0987654321"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowContactModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Saving...' : editingContact ? 'Save Changes' : 'Add Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Partners;
