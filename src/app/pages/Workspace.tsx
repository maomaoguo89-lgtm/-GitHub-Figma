import React, { useState, useEffect } from 'react';
import { Plus, Clock, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../i18n';

interface Project {
  id: number;
  title: string;
  edited: string;
  image: string;
  blur?: boolean;
}

export const Workspace = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  // Initial dummy projects
  const defaultProjects: Project[] = [
    { id: 1, title: 'Visual Strategy (0324)', edited: '6 分钟前', image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&h=250&fit=crop' },
    { id: 2, title: 'Inspiration Draft (0227)', edited: '1 天前', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&h=250&fit=crop' },
    { id: 3, title: 'Untitled', edited: '4 天前', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=250&fit=crop', blur: true },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('iooi_projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      setProjects(defaultProjects);
      localStorage.setItem('iooi_projects', JSON.stringify(defaultProjects));
    }
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newProjectName.trim() || t.workspace.untitled;
    
    const newProject: Project = {
      id: Date.now(),
      title: finalName,
      edited: t.workspace.justNow,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=250&fit=crop', // Placeholder for new
      blur: true
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem('iooi_projects', JSON.stringify(updatedProjects));
    
    setIsModalOpen(false);
    setNewProjectName('');
    
    navigate('/canvas', { state: { projectId: newProject.id, projectName: newProject.title } });
  };

  const handleOpenProject = (project: Project) => {
    navigate('/canvas', { state: { projectId: project.id, projectName: project.title } });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setProjectToDelete(id);
  };

  const confirmDelete = () => {
    if (projectToDelete !== null) {
      const updatedProjects = projects.filter(p => p.id !== projectToDelete);
      setProjects(updatedProjects);
      localStorage.setItem('iooi_projects', JSON.stringify(updatedProjects));
      localStorage.removeItem(`iooi_canvas_${projectToDelete}`);
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
  };

  return (
    <div className="relative min-h-full max-w-[1400px] mx-auto px-10 py-8 flex flex-col">
      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl w-[400px] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold text-white mb-4">{t.workspace.createProject}</h2>
            <form onSubmit={handleCreateProject}>
              <input 
                type="text" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={t.workspace.enterName}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 mb-6 transition-colors"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 transition-colors"
                >
                  {t.workspace.cancel}
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  {t.workspace.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={cancelDelete}>
          <div 
            className="bg-[#111] border border-white/10 p-6 rounded-2xl w-[340px] shadow-2xl relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2 text-center">{t.workspace.confirmDelete}</h2>
            <p className="text-white/50 text-[14px] mb-8 text-center leading-relaxed px-2">
              {t.workspace.deleteMessage.split('\\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i === 0 && <br/>}
                </React.Fragment>
              ))}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                {t.workspace.cancel}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl text-[14px] font-medium text-white bg-red-500/90 hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                {t.workspace.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Projects Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 content-start pt-4">
        
        {/* New Project Card */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="group relative aspect-[16/10] rounded-2xl p-[1px] overflow-hidden cursor-pointer bg-[#050505] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)]"
        >
          {/* Subtle gradient hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative h-full w-full rounded-2xl flex flex-col items-center justify-center gap-5 transition-transform duration-300">
            {/* Plus Button Circle */}
            <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#1c1635] to-[#121429] border border-white/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:border-white/20 shadow-inner">
              <Plus size={28} className="text-white/80 group-hover:text-white transition-colors" strokeWidth={1.5} />
            </div>
            <span className="text-[15px] font-medium text-white/70 group-hover:text-white/90 transition-colors tracking-wide">{t.workspace.newBlankCanvas}</span>
          </div>
        </div>

        {/* Existing Projects */}
        {projects.map(project => (
          <div 
            key={project.id} 
            onClick={() => handleOpenProject(project)}
            className="group relative aspect-[16/10] rounded-2xl cursor-pointer overflow-hidden bg-black/40 border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            {/* Glow behind the card on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
            
            <div className="absolute inset-0 overflow-hidden bg-[#111]">
              <img 
                src={project.image} 
                alt={project.title} 
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${project.blur ? 'blur-md opacity-50' : 'opacity-80 group-hover:opacity-100'}`} 
              />
            </div>
            
            {/* Info Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
              <h3 className="text-[16px] font-medium text-white/90 truncate mb-2 group-hover:text-white drop-shadow-md">{project.title}</h3>
              <p className="text-[13px] text-white/50 flex items-center gap-1.5 font-light">
                <Clock size={13} className="opacity-60" />
                {t.workspace.edited} {project.edited}
              </p>
            </div>
            
            {/* Delete Button */}
            <button
              onClick={(e) => handleDeleteClick(e, project.id)}
              className="absolute top-3 right-3 z-30 group/delbtn flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[rgb(20,20,20)]/90 backdrop-blur-sm border-none font-semibold shadow-[0_0_20px_rgba(0,0,0,0.164)] cursor-pointer transition-all duration-300 overflow-hidden hover:w-[110px] hover:rounded-[50px] hover:bg-[rgb(255,69,69)] opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-[14px] h-[14px] text-white/80 transition-all duration-300 group-hover/delbtn:w-[40px] group-hover/delbtn:text-white group-hover/delbtn:translate-y-[60px]" />
              <span className="absolute top-[-20px] text-white transition-all duration-300 text-[2px] opacity-0 group-hover/delbtn:text-[13px] group-hover/delbtn:opacity-100 group-hover/delbtn:translate-y-[30px] font-medium tracking-wide pointer-events-none">Delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};