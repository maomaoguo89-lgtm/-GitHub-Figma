import React, { useState } from 'react';
import { Search, ChevronDown, Funnel } from 'lucide-react';

export const IooiTV = () => {
  const categories = ['全部', '精选发布', '电视广告', '动画', '叙事短片', 'MV', '创意', '教程', '其他'];
  const [activeCategory, setActiveCategory] = useState('全部');

  const videos = [
    { id: 1, title: '【SIGN】What...', author: '@DIDI_OK', image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=400&h=250&fit=crop' },
    { id: 2, title: '原创科幻电影《奥尔特云边界》', author: '@Dir吕成Sun', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&h=250&fit=crop' },
    { id: 3, title: 'INTEGRATION', author: '@Zerkalo', image: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=400&h=250&fit=crop' },
    { id: 4, title: 'Eternité - Paris', author: '@JeremySHAKE', image: 'https://images.unsplash.com/photo-1502899576159-f224dc2349fa?q=80&w=400&h=250&fit=crop' },
    { id: 5, title: 'ALPHABOT', author: '@roollabs', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&h=250&fit=crop' },
    { id: 6, title: '《杀死那个机器人》', author: '@李李午夜梦回', image: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=400&h=250&fit=crop' },
    { id: 7, title: '短片《格日勒》', author: '@TIANAIT', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400&h=250&fit=crop' },
    { id: 8, title: '化雨', author: '@火鸟AI', image: 'https://images.unsplash.com/photo-1444464666168-49b626f860d5?q=80&w=400&h=250&fit=crop' },
    { id: 9, title: '《FOR WHAT?》反战视频', author: '@Laozhang', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=400&h=250&fit=crop' },
    { id: 10, title: 'Brat! Work | Horse', author: '@BratStudio', image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=400&h=250&fit=crop' },
    { id: 11, title: '赛博江湖', author: '@axpli93', image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400&h=250&fit=crop' },
    { id: 12, title: '饵', author: '@AlexWang', image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=400&h=250&fit=crop' },
    { id: 13, title: 'Nano Banana 2 Spot', author: '@NuovaEraAI', image: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?q=80&w=400&h=250&fit=crop' },
    { id: 14, title: 'Lil Wukong - 500 Winters', author: '@Liliwukong', image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400&h=250&fit=crop' },
    { id: 15, title: '腾讯足光大赏——李海悦', author: '@initialC', image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=400&h=250&fit=crop' },
    { id: 16, title: '寂灭余晖 | The Silent...', author: '@New Iooier', image: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=400&h=250&fit=crop' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-10 py-6 text-white min-h-full">
      {/* Filters Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6 text-[14px] font-medium overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap transition-colors ${activeCategory === cat ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 shrink-0 ml-8">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[13px] text-white/80 transition-colors">
            综合排序 <ChevronDown size={14} />
          </button>
          <div className="flex items-center bg-white/5 rounded border border-white/5 px-3 py-1.5 w-48">
            <Search size={14} className="text-white/40 mr-2" />
            <input 
              type="text" 
              placeholder="搜索 iooiTV..." 
              className="bg-transparent border-none outline-none text-[13px] text-white w-full placeholder:text-white/30"
            />
          </div>
          <button className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors">
            <Funnel size={14} className="text-white/80" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-4">
        {videos.map(video => (
          <div key={video.id} className="flex flex-col gap-2.5 cursor-pointer group">
            <div className="aspect-video rounded-xl overflow-hidden relative border border-white/5 bg-white/5">
              <img src={video.image} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              
              {/* Play icon overlay */}
              <div className="absolute top-2 right-2 w-7 h-7 rounded bg-black/40 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
              </div>
            </div>
            <div className="px-1">
              <p className="text-[12px] text-white/50 mb-0.5">{video.author}</p>
              <h3 className="text-[14px] font-medium text-white/90 truncate group-hover:text-white transition-colors">{video.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
