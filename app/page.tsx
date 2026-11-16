'use client';

import { useEffect, useState, useRef } from 'react';
import { 
    Package, RefreshCw, Copy, Tag, Server, Terminal, 
    Trash2, Search, HardDrive, Layers, Info, AlertTriangle, 
    FolderOpen, FileText, Edit2, Check, X, Play, Loader2,
    Activity, Square, Hash, Clock, Database, ChevronRight,
    SearchX, Filter, Settings, Box, PlayCircle, Plus,
    Clipboard, ExternalLink, Code, Layers2, StickyNote, Save,
    Eye, Cpu, Network, Shield
} from 'lucide-react';

// --- Types ---⁠​‍⁠‌‌⁠‌​‌‍‌‍⁠⁠​‌​‌‌‌‍‌⁠‌​​⁠‌⁠⁠⁠‍⁠⁠​‍⁠‌‍​‌‌⁠‍⁠‍‍⁠​‌​‌⁠‌‌⁠⁠‌‌⁠‌⁠‌‌⁠‌‍

interface Manifest {
    schemaVersion: number;
    name: string;
    tag: string;
    architecture: string;
    os?: string;
    created?: string;
    layers: Array<{ size: number; digest: string }>;
    config?: { digest: string; size: number };
    history?: any[];
}

interface DockerContainer {
    ID: string;
    Image: string;
    Command: string;
    CreatedAt: string;
    Status: string;
    Ports: string;
    Names: string;
}

interface ContainerInspect {
    Id: string;
    Created: string;
    State: any;
    Config: {
        Env: string[];
        Image: string;
        Entrypoint: string[] | null;
        Cmd: string[] | null;
    };
    NetworkSettings: {
        IPAddress: string;
        Ports: any;
    };
    Mounts: any[];
}

type TabType = 'images' | 'containers' | 'volumes';

export default function RegistryPage() {
    const [activeTab, setActiveTab] = useState<TabType>('containers');
    const [searchQuery, setSearchQuery] = useState('');
    const [registryUrl, setRegistryUrl] = useState(process.env.NEXT_PUBLIC_REGISTRY_URL || 'http://localhost:5001');
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [repos, setRepos] = useState<string[]>([]);
    const [repoTags, setRepoTags] = useState<Record<string, string[]>>({});
    const [tagDetails, setTagDetails] = useState<Record<string, Manifest | null>>({});
    const [descriptions, setDescriptions] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [containers, setContainers] = useState<DockerContainer[]>([]);
    const [volumes, setVolumes] = useState<any[]>([]);

    const [editingNoteRepo, setEditingNoteRepo] = useState<string | null>(null);
    const [tempNote, setTempNote] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [showRunModal, setShowRunModal] = useState(false);
    const [targetImage, setTargetImage] = useState('');
    const [runConfig, setRunConfig] = useState({ ports: '', name: '' });

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailImage, setDetailImage] = useState<{repo: string, tag: string} | null>(null);

    const [showLogsModal, setShowLogsModal] = useState(false);
    const [logContainerId, setLogContainerId] = useState<string | null>(null);
    const [containerLogs, setContainerLogs] = useState('');

    const [showInspectModal, setShowInspectModal] = useState(false);
    const [inspectData, setInspectData] = useState<ContainerInspect | null>(null);

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Env var önceliklidir; yoksa localStorage'daki değer kullanılır
        const envUrl = process.env.NEXT_PUBLIC_REGISTRY_URL;
        const saved = localStorage.getItem('registry_url');
        setRegistryUrl(envUrl || saved || 'http://localhost:5001');
        refreshData();
        const timer = setInterval(() => {
            if (activeTab === 'containers') fetchContainers();
            if (activeTab === 'volumes') fetchVolumes();
        }, 8000);
        return () => clearInterval(timer);
    }, [activeTab]);

    useEffect(() => {
        let logTimer: any;
        if (showLogsModal && logContainerId) {
            const fetchLogs = async () => {
                try {
                    const res = await fetch('/api/docker/logs', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: logContainerId, tail: 50 })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setContainerLogs(data.logs);
                    }
                } catch (e) {}
            };
            fetchLogs();
            logTimer = setInterval(fetchLogs, 3000);
        }
        return () => clearInterval(logTimer);
    }, [showLogsModal, logContainerId]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [containerLogs]);

    const refreshData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchCatalog(), fetchDescriptions(), fetchNotes(), fetchContainers(), fetchVolumes()]);
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalog = async () => {
        try {
            const res = await fetch('/api/registry/v2/_catalog', { headers: { 'x-registry-url': registryUrl } });
            if (!res.ok) throw new Error('Registry unreachable');
            const data = await res.json();
            const list = data.repositories || [];
            setRepos(list);
            
            const tagsData: Record<string, string[]> = {};
            await Promise.all(list.map(async (repo: string) => {
                const tagRes = await fetch(`/api/registry/v2/${repo}/tags/list`, { headers: { 'x-registry-url': registryUrl } });
                if (tagRes.ok) {
                    const tagJson = await tagRes.json();
                    tagsData[repo] = tagJson.tags || [];
                    tagJson.tags?.forEach((tag: string) => fetchTagDetails(repo, tag));
                }
            }));
            setRepoTags(tagsData);
            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 2000);
        } catch (err: any) {
            setError(`Registry Error: ${err.message}. If running in Docker, try http://host.docker.internal:5001`);
        }
    };

    const fetchTagDetails = async (repo: string, tag: string) => {
        const key = `${repo}:${tag}`;
        try {
            const res = await fetch(`/api/registry/v2/${repo}/manifests/${tag}`, { 
                headers: { 
                    'x-registry-url': registryUrl,
                    'Accept': 'application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/json'
                } 
            });
            if (res.ok) {
                let data = await res.json();
                let architecture = 'amd64/linux';
                let layers = [];
                let created = undefined;

                // Handle OCI Index (Multi-arch) by picking the first manifest
                if (data.manifests && data.manifests.length > 0) {
                    const firstManifest = data.manifests[0];
                    const subRes = await fetch(`/api/registry/v2/${repo}/manifests/${firstManifest.digest}`, {
                        headers: { 
                            'x-registry-url': registryUrl,
                            'Accept': 'application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json'
                        }
                    });
                    if (subRes.ok) data = await subRes.json();
                }

                if (data.schemaVersion === 1) {
                    layers = data.fsLayers?.map((l: any) => ({ digest: l.blobSum, size: 0 })) || [];
                    try {
                        const history0 = JSON.parse(data.history[0].v1Compatibility);
                        architecture = `${history0.architecture}/${history0.os}`;
                        created = history0.created;
                    } catch (e) {}
                } else if (data.schemaVersion === 2 || data.mediaType?.includes('manifest.v1')) {
                    layers = data.layers || [];
                    if (data.config?.digest) {
                        try {
                            const blobRes = await fetch(`/api/registry/v2/${repo}/blobs/${data.config.digest}`, {
                                headers: { 'x-registry-url': registryUrl }
                            });
                            if (blobRes.ok) {
                                const configData = await blobRes.json();
                                architecture = `${configData.architecture}/${configData.os}`;
                                created = configData.created;
                            }
                        } catch (e) {}
                    }
                }

                setTagDetails(prev => ({ ...prev, [key]: { ...data, architecture, layers, created } }));
            } else {
                // If fetch fails, mark as empty to stop "Calculating" spinner
                setTagDetails(prev => ({ ...prev, [key]: { schemaVersion: 0, name: repo, tag, architecture: 'N/A', layers: [] } }));
            }
        } catch (e) {
            setTagDetails(prev => ({ ...prev, [key]: { schemaVersion: 0, name: repo, tag, architecture: 'N/A', layers: [] } }));
        }
    };

    const fetchContainers = async () => {
        try {
            const res = await fetch('/api/docker/ps/all');
            if (res.ok) setContainers(await res.json());
            else {
                const data = await res.json();
                if (data.error) setError(`Docker Error: ${data.error}. Check socket mounting (-v /var/run/docker.sock)`);
            }
        } catch (e: any) {
            setError(`Docker Connection failed: ${e.message}`);
        }
    };

    const fetchVolumes = async () => {
        try {
            const res = await fetch('/api/docker/volumes');
            if (res.ok) setVolumes(await res.json());
        } catch (e) {}
    };

    const fetchDescriptions = async () => {
        try {
            const res = await fetch('/api/descriptions');
            if (res.ok) setDescriptions(await res.json());
        } catch (e) {}
    };

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/notes');
            if (res.ok) setNotes(await res.json());
        } catch (e) {}
    };

    const saveNote = async (repo: string) => {
        setActionLoading('note');
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo, content: tempNote })
            });
            if (res.ok) {
                setNotes(prev => ({ ...prev, [repo]: tempNote }));
                setEditingNoteRepo(null);
            }
        } catch (e) {} finally { setActionLoading(null); }
    };

    const performContainerAction = async (action: 'start' | 'stop' | 'rm', id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/docker/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchContainers();
        } catch (e) {} finally { setActionLoading(null); }
    };

    const quickRun = async () => {
        setActionLoading('run');
        try {
            const res = await fetch('/api/docker/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: `localhost:5001/${targetImage}`, ports: runConfig.ports, name: runConfig.name })
            });
            if (res.ok) { setShowRunModal(false); fetchContainers(); setActiveTab('containers'); }
        } catch (e) {} finally { setActionLoading(null); }
    };

    const openInspect = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch('/api/docker/inspect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setInspectData(await res.json());
                setShowInspectModal(true);
            }
        } catch (e) {} finally { setActionLoading(null); }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(label);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '...';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'Unknown';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days === 0) return 'Today';
            if (days === 1) return 'Yesterday';
            if (days < 30) return `${days} days ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const filteredRepos = repos.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
    const runningContainers = containers.filter(c => c.Status.toLowerCase().includes('up'));
    const exitedContainers = containers.filter(c => !c.Status.toLowerCase().includes('up'));

    return (
        <div className="flex flex-col h-screen bg-[#09090b] text-gray-100 overflow-hidden font-sans">
            
            {/* Nav Bar */}
            <nav className="h-14 border-b border-white/5 bg-[#09090b] flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Box className="text-white" size={18} />
                        </div>
                        <span className="font-bold tracking-tight">Docker<span className="text-blue-500">Node</span></span>
                    </div>
                </div>

                {error && (
                    <div className="flex-1 flex justify-center px-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 flex items-center gap-3 animate-pulse">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="text-[11px] font-bold text-red-500 tracking-tight">{error}</span>
                            <button onClick={refreshData} className="ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded transition-colors uppercase">Retry</button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {copyFeedback && (
                        <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold border border-green-500/20 animate-in fade-in zoom-in slide-in-from-right-2">
                             COPIED: {copyFeedback}
                        </div>
                    )}
                    <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <Settings size={16} className="text-gray-500" />
                        <span className="text-[10px] font-mono text-gray-500">{registryUrl}</span>
                    </button>
                    <button onClick={refreshData} disabled={loading} className={`p-2 rounded-md hover:bg-white/5 transition-all ${syncSuccess ? 'text-green-500' : 'text-gray-400'}`}>
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : syncSuccess ? <Check size={16} /> : <RefreshCw size={16} />}
                    </button>
                </div>
            </nav>

            {/* Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 border-r border-white/5 bg-[#09090b] p-4 flex flex-col gap-1 shrink-0">
                    <TabLink id="containers" label="Containers" icon={<Box size={18} />} active={activeTab === 'containers'} onClick={setActiveTab} />
                    <TabLink id="images" label="Images" icon={<Layers size={18} />} active={activeTab === 'images'} onClick={setActiveTab} />
                    <TabLink id="volumes" label="Volumes" icon={<Database size={18} />} active={activeTab === 'volumes'} onClick={setActiveTab} />
                </aside>

                {/* Main */}
                <main className="flex-1 overflow-y-auto bg-[#09090b] relative pb-20">
                    <div className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md px-8 py-6 border-b border-white/5 flex items-center gap-4">
                        <div className="flex-1 max-w-xl relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                            <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all focus:ring-1 focus:ring-blue-500/50" />
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        {activeTab === 'images' && <ImagesView />}
                        {activeTab === 'containers' && <ContainersView />}
                        {activeTab === 'volumes' && <VolumesView />}
                    </div>
                </main>
            </div>

            {/* Modals */}
            {showRunModal && <RunModal />}
            {showSettings && <SettingsModal />}
            {showDetailModal && detailImage && <DetailModal repo={detailImage.repo} tag={detailImage.tag} />}
            {showLogsModal && logContainerId && <LogsModal id={logContainerId} />}
            {showInspectModal && inspectData && <InspectModal data={inspectData} />}

            <footer className="h-10 border-t border-white/5 bg-[#09090b] flex items-center justify-between px-6 text-[10px] font-mono text-gray-600">
                <div className="flex items-center gap-2">
                    <span>Active Resource Monitoring</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                </div>
                <div className="flex gap-4">
                    <a 
                        href="https://github.com/1kenz" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 transition-colors flex items-center gap-1.5"
                    >
                        <ExternalLink size={10} />
                        1kenz Docker Pro v2.3
                    </a>
                </div>
            </footer>
        </div>
    );

    function ImagesView() {
        return (
            <div className="grid grid-cols-1 gap-6">
                {filteredRepos.map(repo => (
                    <div key={repo} className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
                        <div className="p-5 flex items-start justify-between bg-white/[0.02] border-b border-white/5">
                            <div className="flex gap-4 min-w-0">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center font-bold text-lg">{repo.substring(0, 2).toUpperCase()}</div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-white text-lg truncate">{repo}</h2>
                                        <button onClick={() => fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo }) })} className="p-1 hover:text-blue-400"><FolderOpen size={16} /></button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{descriptions[repo] || 'Local Docker images developed by ikenz'}</p>
                                </div>
                            </div>
                            <button onClick={() => copyToClipboard(`docker run -d localhost:5001/${repo}:latest`, 'Run Latest')} className="text-[10px] font-mono bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-600/20 hover:bg-blue-600/20 transition-all"><Code size={12} className="inline mr-2" /> Run Latest</button>
                        </div>

                        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                            <div className="flex-1 p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {repoTags[repo]?.map(tag => (
                                    <div key={tag} className="bg-black/40 border border-white/5 rounded-xl p-3 group hover:bg-black/60 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <button 
                                                onClick={() => { setDetailImage({repo, tag}); setShowDetailModal(true); }} 
                                                className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-blue-400 transition-colors p-1"
                                            >
                                                <Box size={18} className="text-blue-500 shrink-0" />
                                                <span className="text-sm font-extrabold text-gray-200 truncate tracking-tight">{tag}</span>
                                            </button>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => copyToClipboard(`docker pull localhost:5001/${repo}:${tag}`, 'Pull Command')}
                                                    className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                    title="Copy Pull"
                                                >
                                                    <Clipboard size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => { setTargetImage(`${repo}:${tag}`); setRunConfig({ ports: '', name: repo.replace(/\//g, '-') + '-' + tag }); setShowRunModal(true); }}
                                                    className="p-1.5 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all scale-110 active:scale-95"
                                                    title="Launch"
                                                >
                                                    <PlayCircle size={22} fill="currentColor" fillOpacity={0.2} />
                                                </button>
                                            </div>
                                        </div>
                                         <div className="flex items-center justify-between mt-1">
                                            <div className="text-[9px] text-gray-600 font-mono">
                                                {tagDetails[`${repo}:${tag}`] ? formatSize(tagDetails[`${repo}:${tag}`]?.layers.reduce((a,l)=>a+l.size, 0) || 0) : '...'}
                                            </div>
                                            <div className="text-[9px] text-gray-700 font-mono flex items-center gap-1">
                                                <Clock size={8} /> {formatTime(tagDetails[`${repo}:${tag}`]?.created)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full lg:w-80 p-5 bg-white/[0.01]">
                                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest"><StickyNote size={12} /> Notes</div>
                                {editingNoteRepo === repo ? (
                                    <div className="space-y-2">
                                        <textarea value={tempNote} onChange={(e) => setTempNote(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-300 min-h-[100px]" />
                                        <button onClick={() => saveNote(repo)} className="w-full bg-green-600 text-[10px] font-bold py-1.5 rounded">SAVE</button>
                                    </div>
                                ) : (
                                    <div onClick={() => { setTempNote(notes[repo] || ''); setEditingNoteRepo(repo); }} className="text-[10px] text-gray-500 italic bg-black/20 p-3 rounded-xl border border-dashed border-white/5 min-h-[100px] cursor-pointer hover:border-white/20 transition-all whitespace-pre-wrap">
                                        {notes[repo] || 'Add development notes or guide...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    function ContainersView() {
        return (
            <div className="space-y-12">
                <div>
                    <h3 className="text-xs font-bold text-green-500 flex items-center gap-2 mb-6 tracking-widest uppercase"><Activity size={14} /> Running Containers</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {runningContainers.length === 0 ? <div className="lg:col-span-2 text-center py-10 text-gray-600 border border-dashed border-white/5 rounded-2xl">No active containers</div> : runningContainers.map(c => <ContainerCard key={c.ID} c={c} active />)}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-gray-500 flex items-center gap-2 mb-6 tracking-widest uppercase"><Square size={14} /> Stopped</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {exitedContainers.map(c => <ContainerCard key={c.ID} c={c} />)}
                    </div>
                </div>
            </div>
        );
    }

    function ContainerCard({ c, active }: { c: DockerContainer, active?: boolean }) {
        const isLoading = actionLoading === c.ID;
        // Parse port to find first public port
        const portMatch = c.Ports.match(/0\.0\.0\.0:(\d+)->/);
        const publicPort = portMatch ? portMatch[1] : null;

        return (
            <div className={`bg-[#121214] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all ${active ? 'ring-1 ring-green-500/20' : ''}`}>
                <div className="p-5 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${active ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-gray-700'}`} />
                        <div>
                            <button 
                                onClick={() => openInspect(c.ID)}
                                className="font-bold text-white text-sm truncate hover:text-blue-500 transition-colors block text-left"
                            >
                                {c.Names}
                            </button>
                            <p className="text-[10px] text-gray-500 font-mono truncate">{c.Image}</p>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        {publicPort && (
                            <IconButton 
                                icon={<ExternalLink size={12} />} 
                                onClick={() => window.open(`http://localhost:${publicPort}`, '_blank')} 
                                color="hover:bg-blue-500/10 hover:text-blue-500" 
                                title="Open in Browser" 
                            />
                        )}
                        <IconButton icon={<Eye size={12} />} onClick={() => openInspect(c.ID)} color="hover:bg-blue-500/10 hover:text-blue-500" title="Inspect" />
                        <IconButton icon={<FileText size={12} />} onClick={() => { setLogContainerId(c.ID); setShowLogsModal(true); }} color="hover:bg-purple-500/10 hover:text-purple-500" title="Logs" />
                        {active ? <IconButton icon={<Square size={12} fill="currentColor" />} onClick={() => performContainerAction('stop', c.ID)} color="hover:bg-red-500/10 hover:text-red-500" title="Stop" /> : <IconButton icon={<Play size={12} fill="currentColor" />} onClick={() => performContainerAction('start', c.ID)} color="hover:bg-green-500/10 hover:text-green-500" title="Start" />}
                        <IconButton icon={<Trash2 size={12} />} onClick={() => confirm('Delete?') && performContainerAction('rm', c.ID)} color="hover:bg-red-500/10 hover:text-red-500" title="Remove" />
                    </div>
                </div>
                <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                    <div className="bg-black/40 border border-white/5 rounded-lg p-2"><p className="text-[8px] font-bold text-gray-600 uppercase">Status</p><p className="text-[10px] text-gray-400 font-mono truncate">{c.Status}</p></div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-2"><p className="text-[8px] font-bold text-gray-600 uppercase">Ports</p><p className="text-[10px] text-blue-400 font-mono truncate">{c.Ports || 'None'}</p></div>
                </div>
            </div>
        );
    }

    function VolumesView() {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {volumes.map(v => (
                    <div key={v.Name} className="bg-[#121214] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex items-center justify-between group">
                        <div className="flex gap-4 min-w-0">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500"><Database size={18} /></div>
                            <div className="min-w-0"><p className="font-bold text-white text-sm truncate">{v.Name}</p><p className="text-[9px] text-gray-600 uppercase font-mono">{v.Driver} Driver</p></div>
                        </div>
                        <button onClick={() => copyToClipboard(v.Name, 'Volume Name')} className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-white"><Clipboard size={14} /></button>
                    </div>
                ))}
            </div>
        );
    }

    // --- Overlay Components ---

    function DetailModal({ repo, tag }: any) {
        const data = tagDetails[`${repo}:${tag}`];
        return (
            <div 
                className="fixed inset-0 z-[110] flex items-center justify-end bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setShowDetailModal(false)}
            >
                <div 
                    className="w-full max-w-3xl h-full bg-[#09090b] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                <Box className="text-white" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">{repo}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">{tag}</span>
                                    <span className="text-gray-500 font-mono text-xs">{data?.architecture || 'Calculating...'}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowDetailModal(false)} className="bg-white/5 p-3 rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                            <X size={28} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-12">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard label="Total Size" value={data ? formatSize(data.layers.reduce((a,l)=>a+l.size, 0)) : '...'} icon={<HardDrive size={18} className="text-blue-500" />} />
                            <StatCard label="Layers" value={`${data?.layers.length || 0} Layers`} icon={<Layers size={18} className="text-purple-500" />} />
                            <StatCard label="Created" value={formatTime(data?.created)} icon={<Clock size={18} className="text-green-500" />} />
                            <StatCard label="Format" value={data?.schemaVersion === 2 ? 'OCI / V2' : 'V1 Manifest'} icon={<FileText size={18} className="text-orange-500" />} />
                        </div>

                        {/* Pull Command Snippet */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Terminal size={14} /> Pull Command
                            </h3>
                            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                                <code className="text-xs text-blue-400 font-mono">docker pull localhost:5001/{repo}:{tag}</code>
                                <button onClick={() => copyToClipboard(`docker pull localhost:5001/${repo}:${tag}`, 'Pull Command')} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-white transition-all">
                                    <Clipboard size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Layers Section - Docker Desktop Style */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers2 size={14} /> Image Layers (Binary Data)
                            </h3>
                            <div className="divide-y divide-white/5 bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
                                {data?.layers.map((layer, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span className="text-[10px] font-mono text-gray-700 w-4">{i+1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
                                                <p className="text-[11px] text-gray-400 font-mono truncate max-w-sm">{layer.digest}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-blue-400/80 font-mono">{formatSize(layer.size)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metadata Details */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> Configuration Metadata
                            </h3>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[11px] text-gray-400 leading-relaxed overflow-x-auto">
                                <div className="space-y-1">
                                    <p><span className="text-blue-500/80">"full_name":</span> <span className="text-green-500/80">"localhost:5001/{repo}:{tag}"</span>,</p>
                                    <p><span className="text-blue-500/80">"schema":</span> {data?.schemaVersion},</p>
                                    <p><span className="text-blue-500/80">"digest":</span> <span className="text-gray-600">"{data?.config?.digest || 'N/A'}"</span>,</p>
                                    <p><span className="text-blue-500/80">"author":</span> <span className="text-gray-600">"ikenz (Local Dashboard Proxy)"</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 border-t border-white/5 bg-white/[0.02] flex gap-4">
                        <button 
                            onClick={() => { setTargetImage(`${repo}:${tag}`); setRunConfig({ ports: '', name: repo.replace(/\//g, '-') + '-' + tag }); setShowRunModal(true); setShowDetailModal(false); }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 group active:scale-95"
                        >
                            <Play size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm">Run Version</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function LogsModal({ id }: { id: string }) {
        return (
            <div 
                className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                onClick={() => setShowLogsModal(false)}
            >
                <div 
                    className="w-full max-w-4xl h-[80vh] bg-[#09090b] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-3"><Terminal size={18} className="text-purple-500" /><span className="font-bold text-sm">Container Output: {id.substring(0, 12)}</span></div>
                        <button onClick={() => setShowLogsModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-black text-gray-300 whitespace-pre-wrap selection:bg-purple-500/30">
                        {containerLogs || 'Connecting to stream...'}
                        <div ref={logsEndRef} />
                    </div>
                    <div className="p-3 border-t border-white/5 text-[9px] text-gray-600 flex justify-between"><span>Auto-polling every 3s</span><span>Tail: last 50 lines</span></div>
                </div>
            </div>
        );
    }

    function InspectModal({ data }: { data: ContainerInspect }) {
        return (
            <div 
                className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                onClick={() => setShowInspectModal(false)}
            >
                <div 
                    className="w-full max-w-3xl h-[80vh] bg-[#121214] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-3"><Eye size={20} className="text-blue-500" /><div><p className="font-bold text-sm">Resource Inspector</p><p className="text-[10px] font-mono text-gray-500">{data.Id}</p></div></div>
                        <button onClick={() => setShowInspectModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5"><p className="text-[10px] font-bold text-gray-600 mb-2">NETWORK IP</p><div className="flex items-center gap-2 text-blue-400 font-mono"><Network size={14} /> {data.NetworkSettings.IPAddress || 'None'}</div></div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5"><p className="text-[10px] font-bold text-gray-600 mb-2">STATE</p><div className="flex items-center gap-2 text-green-500 font-mono uppercase"><Activity size={14} /> {data.State.Status}</div></div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex gap-2"><Shield size={12} /> ENV VARIABLES</p>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-gray-500 divide-y divide-white/5 max-h-40 overflow-y-auto">
                                {data.Config.Env.map((e, i) => <div key={i} className="py-1.5">{e}</div>)}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex gap-2"><HardDrive size={12} /> MOUNT POINTS</p>
                            <div className="space-y-2">
                                {data.Mounts.map((m, i) => <div key={i} className="bg-black/20 p-3 rounded-lg border border-white/5 text-[10px] font-mono flex justify-between"><span className="text-gray-400">{m.Source}</span><span className="text-blue-500">→ {m.Destination}</span></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Helpers ---

    function TabLink({ id, label, icon, active, onClick }: any) {
        return (
            <button onClick={() => onClick(id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'}`}>
                {icon}<span className="text-sm font-medium">{label}</span>
            </button>
        );
    }

    function IconButton({ icon, onClick, color, disabled, title }: any) {
        return (
            <button onClick={onClick} disabled={disabled} title={title} className={`p-2 rounded-lg transition-colors border border-white/5 ${color} disabled:opacity-30`}>
                {disabled ? <Loader2 size={12} className="animate-spin" /> : icon}
            </button>
        );
    }

    function StatCard({ label, value, icon }: any) {
        return (
            <div className="bg-[#121214] border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">{label}</p>
                <div className="flex items-center gap-2 text-white font-mono text-sm">{icon} {value}</div>
            </div>
        );
    }

    function RunModal() {
        return (
            <div 
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200"
                onClick={() => setShowRunModal(false)}
            >
                <div 
                    className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3"><Plus size={20} className="text-blue-500" /><h3 className="font-bold text-white text-sm">Launch Image</h3></div>
                        <button onClick={() => setShowRunModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Port Mapping</label>
                            <input autoFocus type="text" placeholder="e.g. 8080:80" value={runConfig.ports} onChange={(e) => setRunConfig({ ...runConfig, ports: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name Override</label>
                            <input type="text" value={runConfig.name} onChange={(e) => setRunConfig({ ...runConfig, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
                        </div>
                        <button onClick={quickRun} className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all">Launch Instance</button>
                    </div>
                </div>
            </div>
        );
    }

    function SettingsModal() {
        const [tempUrl, setTempUrl] = useState(registryUrl);
        
        const handleSave = () => {
            setRegistryUrl(tempUrl);
            localStorage.setItem('registry_url', tempUrl);
            setShowSettings(false);
            refreshData();
        };

        return (
            <div 
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setShowSettings(false)}
            >
                <div 
                    className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <Settings size={18} className="text-gray-400" />
                            <h3 className="font-bold text-sm">Registry Settings</h3>
                        </div>
                        <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local Registry URL</label>
                            <div className="relative">
                                <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="http://localhost:5001" 
                                    value={tempUrl} 
                                    onChange={(e) => setTempUrl(e.target.value)} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" 
                                />
                            </div>
                            <p className="text-[9px] text-gray-600">Enter the base URL including port (e.g., http://localhost:5001)</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-[11px] font-bold hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
// ref: 5d19bc4567437fbcb617bac475f5dd76⁠​‍⁠‌‌⁠‌​‌‍‌‍⁠⁠​‌​‌‌‌‍‌⁠‌​​⁠‌⁠⁠⁠‍⁠⁠​‍⁠‌‍​‌‌⁠‍⁠‍‍⁠​‌​‌⁠‌‌⁠⁠‌‌⁠‌⁠‌‌⁠‌‍
