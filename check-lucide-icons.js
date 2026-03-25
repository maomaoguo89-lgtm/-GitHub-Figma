import * as lucide from "lucide-react";

const iconsToCheck = [
  "Plus", "MousePointer", "Image", "Video", "Type", "Music", 
  "Upload", "Settings", "Share2", "Download", "Play", "Sparkles", 
  "Hand", "X", "Camera", "Sun", "Maximize", "Layers", "Zap", 
  "ChevronRight", "ChevronLeft", "MoreHorizontal", "RefreshCw", 
  "Eraser", "Wand2", "Shapes", "Layout", "MessageCircle", "History", 
  "Grid", "Minus", "HelpCircle", "Map", "Save", "FolderOpen", 
  "Pencil", "Pen", "Bell", "User", "LogOut", "Mic", "Headset", 
  "Phone", "PanelRight", "Bot", "Grip", "Cloud", "CloudLightning", 
  "Database", "ChevronDown", "CircleCheck", "CreditCard", "Wallet", 
  "Users", "ArrowUp"
];

const missing = iconsToCheck.filter(name => !lucide[name]);

// write to a file so we can read it
import fs from 'fs';
fs.writeFileSync('missing-icons.txt', missing.join(', '));
