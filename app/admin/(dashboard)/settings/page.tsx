"use client";

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="max-w-4xl">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-zinc-400">Configure global site settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
                <nav className="flex flex-col space-y-1 sticky top-8">
                    {['General', 'SEO & Meta', 'Social Links', 'Danger Zone'].map((tab) => {
                        const id = tab.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === id 
                                    ? 'bg-accent/10 text-accent' 
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* General Settings */}
                <div className={`space-y-6 ${activeTab === 'general' ? 'block' : 'hidden'}`}>
                    <div className="bg-card border border-white/5 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">General Information</h2>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Site Title</label>
                                <input type="text" defaultValue="FutureTech Blog" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-colors" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tagline</label>
                                <input type="text" defaultValue="Exploring the frontiers of technology." className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-colors" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Logo</label>
                                <div className="border border-dashed border-white/10 rounded-lg p-8 text-center hover:border-accent/50 transition-colors cursor-pointer bg-white/[0.02]">
                                    <div className="h-12 w-12 bg-zinc-800 rounded-lg mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white">FT</div>
                                    <div className="text-sm font-medium text-zinc-300">Click to replace</div>
                                    <div className="text-xs text-zinc-500 mt-1">SVG, PNG, JPG (max. 2MB)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-white/5 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Content & Display</h2>
                        <div className="space-y-4">
                             <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-white/[0.02]">
                                <div>
                                    <div className="text-sm font-medium text-white">Maintenance Mode</div>
                                    <div className="text-xs text-zinc-500">Disable access for non-admin users</div>
                                </div>
                                <div className="h-6 w-11 bg-zinc-700 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-transform"></div>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Posts Per Page</label>
                                <div className="flex items-center gap-4">
                                     <input type="number" defaultValue="10" className="w-24 bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-colors" />
                                     <span className="text-xs text-zinc-500">Default pagination limit for blog archives.</span>
                                </div>
                            </div>
                        </div>
                         <div className="pt-6 flex justify-end">
                            <Button variant="primary">Save General Settings</Button>
                        </div>
                    </div>
                </div>

                {/* SEO Settings */}
                 <div className={`space-y-6 ${activeTab === 'seo-meta' ? 'block' : 'hidden'}`}>
                    <div className="bg-card border border-white/5 rounded-xl p-6">
                         <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Global SEO</h2>
                         <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Meta Description (Default)</label>
                                <textarea rows={3} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-colors text-sm leading-relaxed" defaultValue="FutureTech Blog is your daily source for the latest news in AI, Quantum Computing, and Space Exploration."></textarea>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Keywords (Comma separated)</label>
                                <input type="text" defaultValue="technology, ai, future, space, innovation" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-colors" />
                            </div>
                         </div>
                    </div>
                     <div className="bg-card border border-white/5 rounded-xl p-6">
                         <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Open Graph / Social</h2>
                         <div className="border border-dashed border-white/10 rounded-lg p-12 text-center hover:border-accent/50 transition-colors cursor-pointer bg-white/[0.02]">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-500 mx-auto mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                             </svg>
                            <div className="text-sm font-medium text-zinc-300">Default Share Image</div>
                            <div className="text-xs text-zinc-500 mt-1">1200x630px recommended</div>
                        </div>
                          <div className="pt-6 flex justify-end">
                            <Button variant="primary">Save SEO Settings</Button>
                        </div>
                     </div>
                 </div>

                 {/* Social Links Settings */}
                 <div className={`space-y-6 ${activeTab === 'social-links' ? 'block' : 'hidden'}`}>
                    <div className="bg-card border border-white/5 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Social Media Connections</h2>
                         <div className="space-y-4">
                             {['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'GitHub'].map((platform) => (
                                <div key={platform} className="flex items-center gap-4">
                                    <div className="w-24 text-sm font-medium text-zinc-400">{platform}</div>
                                    <input type="text" placeholder={`https://${platform.toLowerCase()}.com/...`} className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-colors" />
                                </div>
                             ))}
                         </div>
                         <div className="pt-6 flex justify-end">
                            <Button variant="primary">Save Social Links</Button>
                        </div>
                    </div>
                 </div>

                 {/* Danger Zone */}
                 <div className={`space-y-6 ${activeTab === 'danger-zone' ? 'block' : 'hidden'}`}>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
                         <h2 className="text-lg font-bold text-red-500 mb-6 border-b border-red-500/10 pb-4">Danger Zone</h2>
                         <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                 <div>
                                     <div className="font-bold text-zinc-200">Clear System Cache</div>
                                     <div className="text-xs text-zinc-500">Remove all temporary files and cached copies of content.</div>
                                 </div>
                                 <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">Clear Cache</Button>
                             </div>
                              <div className="flex items-center justify-between">
                                 <div>
                                     <div className="font-bold text-zinc-200">Reset Search Index</div>
                                     <div className="text-xs text-zinc-500">Rebuild the search index from scratch. Useful if search results are inaccurate.</div>
                                 </div>
                                 <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300">Rebuild Index</Button>
                             </div>
                         </div>
                    </div>
                 </div>

            </div>
        </div>
    </div>
  );
}
