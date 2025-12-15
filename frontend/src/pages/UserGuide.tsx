import React from 'react';

const UserGuide: React.FC = () => {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">AidRigs Parts Database User Guide</h1>

            <div className="flex gap-8">
                {/* Navigation Sidebar */}
                <div className="w-64 flex-shrink-0 hidden lg:block">
                    <div className="sticky top-8 space-y-4">
                        <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-sm">Contents</h3>
                        <nav className="space-y-2">
                            <a href="#introduction" className="block text-gray-600 hover:text-red-600">Introduction</a>
                            <a href="#parts-management" className="block text-gray-600 hover:text-red-600">Parts Management</a>
                            <a href="#translations" className="block text-gray-600 hover:text-red-600">Translations</a>
                            <a href="#quotes-ai" className="block text-gray-600 hover:text-red-600">Quotes & AI Extraction</a>
                            <a href="#reference-data" className="block text-gray-600 hover:text-red-600">Reference Data</a>
                            <a href="#partners" className="block text-gray-600 hover:text-red-600">Partners & Contacts</a>
                            <a href="#vehicles" className="block text-gray-600 hover:text-red-600">Vehicles & Compatibility</a>
                            <a href="#approvals" className="block text-gray-600 hover:text-red-600">Approval Workflow</a>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-12">
                    {/* Introduction */}
                    <section id="introduction">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Welcome to the AidRigs Parts Database. This comprehensive system is designed to streamline the management of spare parts, standardize multilingual translations, automate quote processing via AI, and maintain global reference data.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                            <p className="text-sm text-blue-700">
                                <strong>Tip:</strong> Bulk upload via CSV is supported for <strong>all data entries</strong> (Parts, Translations, Manufacturers, etc.), making it easy to migrate or update large datasets.
                            </p>
                        </div>
                    </section>

                    {/* Parts Management */}
                    <section id="parts-management">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Parts Management</h2>

                        <div className="space-y-8">
                            {/* Catalog & Tabs */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Parts Catalog & Detail View</h3>
                                <p className="text-gray-600 mb-2">
                                    The <strong>Parts Catalog</strong> is the central repository. Clicking on any part opens the <strong>Detail View</strong>, which is organized into three main tabs:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                                    <li><strong>Details:</strong> Basic information (Part ID, Manufacturer, Dimensions, Weight, Image).</li>
                                    <li><strong>Pricing:</strong> Manage price points for different customer tiers.</li>
                                    <li><strong>Equivalences:</strong> Manage interchangeable parts.</li>
                                </ul>
                            </div>

                            {/* Equivalency Deep Dive */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Feature Deep Dive: Parts Equivalency</h3>
                                <p className="text-gray-600 mb-4">
                                    This mission-critical feature allows you to link parts that are technically interchangeable (e.g., a filter from Brand A that fits the same engine as a filter from Brand B).
                                </p>

                                <h4 className="font-semibold text-gray-800 mb-2">How it Works</h4>
                                <p className="text-gray-600 mb-4">
                                    The system uses an <strong>Equivalence Group</strong> logic. When you link Part A to Part B, they become part of the same group. Any other part added to this group (e.g., Part C) automatically becomes equivalent to both Part A and Part B. This transitive relationship ensures comprehensive cross-referencing.
                                </p>

                                <h4 className="font-semibold text-gray-800 mb-2">Adding Equivalents</h4>
                                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-2">
                                    <li>
                                        <strong>Single Addition:</strong> Search for an existing part in the database and link it.
                                    </li>
                                    <li>
                                        <strong>Bulk Addition:</strong> Paste a list of Part IDs.
                                        <span className="block ml-6 text-sm text-gray-500 mt-1">
                                            ✨ <strong>Auto-Creation:</strong> If you enter a Part ID that doesn't exist in the system, it will be <strong>automatically created</strong> with a "Pending Approval" status. This allows you to rapidly build cross-reference lists without stopping to create each part record manually.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            {/* Pricing Tiers Deep Dive */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Feature Deep Dive: Pricing Tiers</h3>
                                <p className="text-gray-600 mb-4">
                                    Pricing is managed through a flexible tier system, allowing you to set different prices for different contexts (e.g., Retail, Wholesale, NGO Special Rate).
                                </p>

                                <h4 className="font-semibold text-gray-800 mb-2">1. Configuration (Admin)</h4>
                                <p className="text-gray-600 mb-4">
                                    Administrators define the available tiers in <strong>Administration &gt; System Configuration &gt; Price Tiers</strong>. Here you can create tiers like "Standard", "Premium", or "Bulk".
                                </p>

                                <h4 className="font-semibold text-gray-800 mb-2">2. Assignment (User)</h4>
                                <p className="text-gray-600">
                                    In the <strong>Pricing</strong> tab of a part, you can add a price. The dropdown menu will strictly populate with the tiers configured by the admin. You cannot invent new tiers on the fly; this ensures data consistency across the organization.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Translations */}
                    <section id="translations">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Translations & Standardization</h2>
                        <p className="text-gray-600 mb-4">
                            The <strong>Parts Translation</strong> module ensures consistency across languages. The system currently supports:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 ml-4 mb-6">
                            <li><strong>English (EN):</strong> The primary key and standard reference.</li>
                            <li><strong>Portuguese (PT):</strong> For Lusophone regions.</li>
                            <li><strong>French (FR):</strong> For Francophone regions.</li>
                        </ul>

                        {/* Deep Dive */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-6">
                            <h3 className="text-lg font-bold text-gray-900">Feature Deep Dive: Translation Management</h3>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">🔍 Search & Duplicate Prevention</h4>
                                <p className="text-gray-600 mb-2">
                                    When adding a new translation, the <strong>English Name (part_name_en)</strong> field features intelligent search:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1 text-sm">
                                    <li>Type to see <strong>all existing similar names</strong> in real-time</li>
                                    <li>If you select an existing name, you'll see a merge warning</li>
                                    <li>Prevents duplicates like "Oil Filter" and "Filter, Oil" coexisting</li>
                                    <li><strong>Primary Key:</strong> part_name_en serves as the unique identifier</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">⚡ On-the-Fly HS Code Creation</h4>
                                <p className="text-gray-600 text-sm">
                                    Don't have the HS code you need? No problem. In the HS Code dropdown, you can create new codes instantly.
                                    New HS codes are <strong>submitted for approval</strong> automatically and become available once reviewed.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">📋 CSV Bulk Upload</h4>
                                <p className="text-gray-600 text-sm">
                                    Upload hundreds of translations at once using the CSV template. Download the template first to ensure your data matches
                                    the required format (part_name_en, part_name_pr, part_name_fr, hs_code, category_en, etc.).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Quotes & AI Extraction */}
                    <section id="quotes-ai">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quotes & AI Extraction</h2>
                        <p className="text-gray-600 mb-4">
                            Automate data entry from supplier quotes using our AI extraction tool.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">1</div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-medium text-gray-900">Upload</h4>
                                    <p className="text-gray-600">Upload PDF or Image quotes via the <strong>Extracted Quotes</strong> page.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">2</div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-medium text-gray-900">AI Processing</h4>
                                    <p className="text-gray-600">The system automatically extracts part numbers, descriptions, quantities, and prices.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">3</div>
                                <div className="ml-4">
                                    <h4 className="text-lg font-medium text-gray-900">Review & Import</h4>
                                    <p className="text-gray-600">Review the extracted data for accuracy, make corrections if needed, and import the items directly into the database.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Reference Data */}
                    <section id="reference-data">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reference Data</h2>
                        <p className="text-gray-600 mb-6">
                            Maintain the backbone of the system with these reference modules:
                        </p>

                        {/* Manufacturers Deep Dive */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Manufacturers</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Manage part manufacturers. Support for OEM, APM (Aftermarket), and Remanufacturers.
                            </p>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>⚠️ Approval Required:</strong> All new manufacturers are submitted with "Pending Approval" status
                                    and are <strong>hidden from global lists</strong> until an administrator approves them.
                                </p>
                            </div>
                            <ul className="list-disc list-inside text-gray-600 text-sm ml-4 space-y-1">
                                <li>Track manufacturer type, country, website, and certifications</li>
                                <li>Country dropdown for standardized location data</li>
                                <li><strong>No CSV upload</strong> - manual entry only to ensure quality</li>
                            </ul>
                        </div>

                        {/* Categories Deep Dive */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Categories</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Organize parts into logical groups (e.g., Engine Parts, Filters, Brakes). Categories are multilingual.
                            </p>
                            <ul className="list-disc list-inside text-gray-600 text-sm ml-4 space-y-1">
                                <li>Supports English, Portuguese, and French names</li>
                                <li>Simple CRUD operations (Create, Read, Update, Delete)</li>
                                <li><strong>No approval workflow</strong> - changes go live immediately</li>
                                <li><strong>No CSV upload</strong> - managed through the UI only</li>
                            </ul>
                        </div>

                        {/* Ports Deep Dive */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Ports</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Global shipping ports for international logistics. Critical for customs and shipping documentation.
                            </p>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>⚠️ Approval Required:</strong> New ports require approval to maintain data integrity.
                                </p>
                            </div>
                            <ul className="list-disc list-inside text-gray-600 text-sm ml-4 space-y-1">
                                <li>Port code (5-char standard), name, country, and city</li>
                                <li>Port type categorization (Sea, Air, etc.)</li>
                                <li><strong>✅ CSV Bulk Upload:</strong> Use the template to upload multiple ports at once</li>
                                <li>Country dropdown for standardized data entry</li>
                            </ul>
                        </div>

                        {/* HS Codes Deep Dive */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">HS Codes</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Harmonized System codes for customs clearance. Essential for international shipping.
                            </p>
                            <ul className="list-disc list-inside text-gray-600 text-sm ml-4 space-y-1">
                                <li><strong>On-the-fly Creation:</strong> You can create new HS Codes directly from the Translation screen.</li>
                                <li><strong>Approval Required:</strong> New codes must be approved by an admin.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Partners & Contacts */}
                    <section id="partners">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Partners & Contacts</h2>
                        <p className="text-gray-600 mb-4">
                            The <strong>Partners</strong> module is your central directory for all external entities, including suppliers, customers, and logistics providers.
                        </p>

                        <div className="space-y-6">
                            {/* Partner Types */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Partner Types</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <li className="flex items-start">
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mt-0.5">Supplier</span>
                                        <span className="text-gray-600">Vendors for part purchasing.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2 mt-0.5">Customer</span>
                                        <span className="text-gray-600">Clients for part sales.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mr-2 mt-0.5">AR Storage</span>
                                        <span className="text-gray-600">Internal storage/warehouse locations.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-2 mt-0.5">Forwarder</span>
                                        <span className="text-gray-600">Logistics and shipping partners.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Contacts Management */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Managing Contacts</h3>
                                <p className="text-gray-600 mb-3">
                                    The interface uses a split-view layout. Selecting a partner from the list on the left opens their details on the right.
                                </p>
                                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                                    <li><strong>Location Details:</strong> View street address, city, and country.</li>
                                    <li><strong>Contacts List:</strong> Add multiple contact persons for each partner.</li>
                                    <li><strong>Contact Info:</strong> Store Job Title, Email, and two Phone numbers per contact.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Vehicles & Compatibility */}
                    <section id="vehicles">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vehicles & Compatibility</h2>
                        <p className="text-gray-600 mb-4">
                            The <strong>Vehicles</strong> module manages the fleet applications. It allows you to define vehicles and link them to parts and other equivalent vehicles.
                        </p>

                        <div className="space-y-8">
                            {/* Vehicle Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Vehicle Information</h3>
                                <p className="text-gray-600 mb-2">
                                    Vehicles are identified by their <strong>VIN</strong> (17-character standard) and defined by:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1 mb-4">
                                    <li><strong>Core Info:</strong> Make, Model, Year.</li>
                                    <li><strong>Specs:</strong> Engine, Trim, Transmission, Drive Type.</li>
                                </ul>
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                    <p className="text-sm text-blue-700">
                                        <strong>Bulk Upload:</strong> You can upload large vehicle fleets using the CSV template. Click "Download Template" in the Vehicles page to get started.
                                    </p>
                                </div>
                            </div>

                            {/* Compatibility Deep Dive */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-3">Feature Deep Dive: Compatibility Logic</h3>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-2">1. Equivalent Vehicles</h4>
                                        <p className="text-gray-600 mb-2">
                                            This feature allows you to link vehicles that are technically similar or identical for parts purposes.
                                        </p>
                                        <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1 text-sm">
                                            <li><strong>How to Link:</strong> In the vehicle details, click "+ Add" under Equivalent Vehicles.</li>
                                            <li><strong>Selection:</strong> Choose another vehicle from the database to link it.</li>
                                            <li><strong>Tabs:</strong> If a vehicle has multiple equivalents, they appear as tabs for easy navigation.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-2">2. Parts Compatibility</h4>
                                        <p className="text-gray-600 mb-2">
                                            Directly link parts to vehicles to build your application catalog.
                                        </p>
                                        <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1 text-sm">
                                            <li><strong>Adding Parts:</strong> Search for a part by ID or Name and add it to the vehicle.</li>
                                            <li><strong>Notes Field:</strong> Use the notes field for specific fitment details (e.g., "Front only", "Requires heavy duty suspension").</li>
                                            <li><strong>Verification:</strong> Linked parts appear in the "Compatible Parts" list with their full designation and manufacturer info.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Approvals */}
                    <section id="approvals">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Approval Workflow</h2>
                        <p className="text-gray-600 mb-4">
                            To maintain high data integrity and adhere to company data quality standards, the approval workflow is <strong>mandatory</strong> for the following entities:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 ml-4 mb-4 font-medium">
                            <li>Translations</li>
                            <li>Manufacturers</li>
                            <li>HS Codes</li>
                            <li>Ports</li>
                            <li>Parts (including auto-created equivalents)</li>
                        </ul>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <p className="text-sm text-yellow-700">
                                <strong>Note:</strong> Items in "Pending" status are not visible globally until approved by an administrator.
                            </p>
                        </div>
                        <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-2">
                            <li><strong>Submission:</strong> A user creates a new entry.</li>
                            <li><strong>Pending State:</strong> The entry enters a "Pending Approval" state.</li>
                            <li><strong>Review:</strong> Administrators review the request in the <strong>Pending Approvals</strong> dashboard.</li>
                            <li><strong>Decision:</strong> The request is either <strong>Approved</strong> (making it live) or <strong>Rejected</strong> (with a reason provided).</li>
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
