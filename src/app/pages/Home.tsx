import React from 'react';
import { useNavigate } from 'react-router';
import { Link, Video, LayoutGrid, Sparkles, Layers, ChevronRight, ChevronLeft, Pen, Image as ImageIcon } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  const heroBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1625934036482-2dccff707564?q=80&w=600&h=400&fit=crop',
      title: '跑狗传, 马上故事赢1万',
      subtitle: 'iooiTV Arena 36 小时动画黑客松 • 现已开放报名'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1749097423941-241108cf8448?q=80&w=600&h=400&fit=crop',
      title: '进化 • 碰撞 • 逆向',
      subtitle: 'iooi × SXSW 2026 全球狂欢计划正式开启'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1636220506380-30a272f09562?q=80&w=600&h=400&fit=crop',
      title: '释放无限创造力',
      subtitle: 'Nano Banana 2 模型 上线'
    }
  ];

  const features = [
    { id: 1, name: '涂鸦生视频', icon: Video, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 2, name: '涂鸦生图', icon: ImageIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 3, name: '姿势控制', icon: Pen, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { id: 4, name: '关联与起效, 一键呈现', icon: Link, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 5, name: '一键拉片', icon: Video, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 6, name: '分镜策划', icon: LayoutGrid, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { id: 7, name: '找灵感', icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
    { id: 8, name: '情绪板策划', icon: Layers, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-10 py-8 text-white space-y-12">
      {/* Hero Banners */}
      <div className="relative group">
        <div className="grid grid-cols-3 gap-4">
          {heroBanners.map(banner => (
            <div key={banner.id} className="flex flex-col gap-3 cursor-pointer group/card">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden relative">
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
                <div className="absolute inset-0 bg-black/20 group-hover/card:bg-transparent transition-colors"></div>
              </div>
              <div>
                <p className="text-[13px] text-white/50 font-medium mb-1">{banner.title}</p>
                <h3 className="text-[15px] font-bold text-white/90">{banner.subtitle}</h3>
              </div>
            </div>
          ))}
        </div>
        <button className="absolute left-2 top-[40%] -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black/80">
          <ChevronLeft size={16} />
        </button>
        <button className="absolute right-2 top-[40%] -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur hover:bg-black/80">
          <ChevronRight size={16} />
        </button>
        <div className="flex justify-center gap-1.5 mt-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-0.5 rounded-full ${i === 0 ? 'w-4 bg-white' : 'w-4 bg-white/20'}`}></div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold mb-4">特色功能</h2>
        <div className="grid grid-cols-5 gap-3">
          {/* Create Project Button */}
          <div 
            onClick={() => navigate('/canvas')}
            className="col-span-1 row-span-2 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 flex flex-col justify-between cursor-pointer relative overflow-hidden group hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md">
              <Pen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">创建新项目</h3>
              <button className="px-4 py-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-full text-xs font-medium backdrop-blur-md text-white border border-white/10">
                立即尝试
              </button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="col-span-4 grid grid-cols-4 gap-3">
            {features.map(f => (
              <div key={f.id} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-xl p-4 flex items-center gap-3 cursor-pointer border border-white/5">
                <div className={`w-8 h-8 rounded-lg ${f.bg} flex items-center justify-center`}>
                  <f.icon size={16} className={f.color} />
                </div>
                <span className="text-sm font-medium text-white/80">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
