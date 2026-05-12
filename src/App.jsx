import { useState, useEffect, useRef } from "react";

const ACCENT = "#C8FF00";
const BG = "#0D0D0D";
const CARD_BG = "#161616";
const BORDER = "#2A2A2A";
const MUTED = "#555";
const TEXT = "#F0F0F0";

function createClient(url, key) {
  const headers = { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "Prefer": "return=representation" };
  return {
    async getAll() { const r = await fetch(`${url}/rest/v1/items?select=*&order=created_at.desc`, { headers }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
    async insert(item) { const r = await fetch(`${url}/rest/v1/items`, { method:"POST", headers, body:JSON.stringify(item) }); if (!r.ok) throw new Error(await r.text()); return (await r.json())[0]; },
    async update(id, patch) { const r = await fetch(`${url}/rest/v1/items?id=eq.${id}`, { method:"PATCH", headers, body:JSON.stringify(patch) }); if (!r.ok) throw new Error(await r.text()); return (await r.json())[0]; },
    async remove(id) { const r = await fetch(`${url}/rest/v1/items?id=eq.${id}`, { method:"DELETE", headers }); if (!r.ok) throw new Error(await r.text()); },
  };
}

const EMOJIS = ["📦","🥫","🔧","💊","📱","👕","🍎","🖥️","🛒","🧴","🔩","📋"];
const CATEGORIES = ["Geral","Alimentos","Eletrônicos","Vestuário","Ferramentas","Saúde","Outros"];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0D0D0D;color:#F0F0F0;font-family:'DM Mono',monospace;min-height:100vh}
.app{max-width:960px;margin:0 auto;padding:0 20px 100px}
.header{display:flex;align-items:flex-end;justify-content:space-between;padding:40px 0 28px;border-bottom:1px solid #2A2A2A;margin-bottom:28px}
.logo{font-family:'Syne',sans-serif;font-size:38px;font-weight:800;letter-spacing:-2px;line-height:1;color:#F0F0F0}
.logo span{color:#C8FF00}
.header-meta{text-align:right;font-size:11px;color:#555;letter-spacing:.08em;text-transform:uppercase}
.header-meta strong{display:block;font-size:20px;color:#C8FF00;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:-1px;text-transform:none}
.toolbar{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.search-box{flex:1;background:#161616;border:1px solid #2A2A2A;border-radius:8px;padding:10px 16px;color:#F0F0F0;font-family:'DM Mono',monospace;font-size:13px;outline:none}
.search-box::placeholder{color:#555}
.btn-add{background:#C8FF00;color:#000;border:none;border-radius:8px;padding:10px 20px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap}
.filters{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.pill{background:transparent;border:1px solid #2A2A2A;color:#555;border-radius:99px;padding:5px 14px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:.05em;text-transform:uppercase}
.pill.active{background:#C8FF0022;border-color:#C8FF00;color:#C8FF00}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.card{background:#161616;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card-img{width:100%;aspect-ratio:4/3;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer}
.card-img img{width:100%;height:100%;object-fit:cover}
.badge-low{position:absolute;top:8px;right:8px;background:#FF4444;color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:99px}
.card-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:10px;flex:1}
.card-name{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#F0F0F0}
.card-cat{font-size:10px;color:#555;letter-spacing:.08em;text-transform:uppercase}
.qty-row{display:flex;align-items:center;justify-content:space-between}
.qty-ctrl{display:flex;align-items:center;border:1px solid #2A2A2A;border-radius:8px;overflow:hidden}
.qty-btn{background:transparent;border:none;color:#F0F0F0;width:36px;height:36px;font-size:18px;cursor:pointer}
.qty-div{width:1px;background:#2A2A2A;height:24px}
.qty-val{width:44px;text-align:center;font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#F0F0F0}
.qty-val.low{color:#FF4444}
.qty-val.ok{color:#C8FF00}
.card-acts{display:flex;gap:6px}
.bico{flex:1;background:transparent;border:1px solid #2A2A2A;border-radius:6px;color:#555;padding:6px;font-size:10px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;font-family:'DM Mono',monospace}
.empty{grid-column:1/-1;text-align:center;padding:60px 20px;color:#555}
.overlay{position:fixed;inset:0;background:#000000cc;display:flex;align-items:center;justify-content:center;z-index:100}
.modal{background:#111;border:1px solid #2A2A2A;border-radius:16px;width:100%;max-width:420px;padding:28px;display:flex;flex-direction:column;gap:18px;margin:16px;max-height:90vh;overflow-y:auto}
.modal-title{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:#F0F0F0}
.modal-title span{color:#C8FF00}
.field{display:flex;flex-direction:column;gap:5px}
.field label{font-size:10px;color:#555;letter-spacing:.1em;text-transform:uppercase}
.field input,.field select{background:#161616;border:1px solid #2A2A2A;border-radius:8px;padding:10px 13px;color:#F0F0F0;font-family:'DM Mono',monospace;font-size:13px;outline:none}
.field select option{background:#1a1a1a}
.erow{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}
.epill{background:#1a1a1a;border:1px solid #2A2A2A;border-radius:6px;padding:4px 7px;font-size:17px;cursor:pointer}
.epill.sel{border-color:#C8FF00;background:#C8FF0015}
.mfoot{display:flex;gap:8px}
.btn-x{flex:1;background:transparent;border:1px solid #2A2A2A;border-radius:8px;padding:11px;color:#555;font-family:'DM Mono',monospace;font-size:12px;cursor:pointer}
.btn-ok{flex:2;background:#C8FF00;border:none;border-radius:8px;padding:11px;color:#000;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer}
.btn-ok:disabled{opacity:.4;cursor:not-allowed}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#C8FF00;color:#000;font-family:'DM Mono',monospace;font-size:12px;padding:9px 18px;border-radius:99px;z-index:200;white-space:nowrap}
.setup{max-width:500px;margin:0 auto;padding:52px 20px}
.sstep{display:flex;gap:14px;margin-bottom:24px}
.snum{width:26px;height:26px;border-radius:50%;background:#C8FF00;color:#000;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.stitle{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:5px;color:#F0F0F0}
.sdesc{font-size:11px;color:#555;line-height:1.75}
.sdesc a{color:#C8FF00;text-decoration:none}
.sdesc strong{color:#F0F0F0}
.sql{background:#1a1a1a;border:1px solid #2A2A2A;border-radius:8px;padding:12px 14px;margin-top:10px;font-size:10px;color:#999;line-height:1.9;font-family:'DM Mono',monospace;white-space:pre-wrap}
.divl{height:1px;background:#2A2A2A;margin:4px 0 24px}
.cinputs{display:flex;flex-direction:column;gap:7px;margin-top:10px}
.cinputs input{background:#161616;border:1px solid #2A2A2A;border-radius:8px;padding:10px 13px;color:#F0F0F0;font-family:'DM Mono',monospace;font-size:11px;outline:none;width:100%}
.cinputs input::placeholder{color:#555}
.btn-conn{background:#C8FF00;color:#000;border:none;border-radius:8px;padding:11px 20px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;margin-top:10px;width:100%}
.btn-conn:disabled{opacity:.4;cursor:not-allowed}
.errbox{background:#FF444415;border:1px solid #FF444430;border-radius:8px;padding:10px 13px;font-size:11px;color:#FF7777;margin-top:8px}
`;

const SQL = `create table items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  qty integer default 0,
  emoji text default '📦',
  category text default 'Geral',
  img text,
  created_at timestamptz default now()
);
alter table items enable row level security;
create policy "public access" on items for all using (true);`;

function SetupWizard({ onConnect }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const connect = async () => {
    if (!url.trim()||!key.trim()) return;
    setLoading(true); setError("");
    try { const c = createClient(url.trim().replace(/\/$/,""),key.trim()); await c.getAll(); onConnect(url.trim().replace(/\/$/,""),key.trim()); }
    catch { setError("Conexão falhou. Verifique a URL e a chave anon."); }
    finally { setLoading(false); }
  };
  return (
    <div><style>{css}</style>
    <div className="setup">
      <div style={{marginBottom:40}}>
        <div className="logo" style={{marginBottom:6}}>Trial<span>.</span></div>
        <div style={{fontSize:11,color:MUTED,letterSpacing:"0.06em",textTransform:"uppercase"}}>Configuração — Supabase</div>
      </div>
      <div className="sstep"><div className="snum">1</div><div><div className="stitle">Criar tabela no Supabase</div><div className="sdesc">SQL Editor → New query → cole e execute:<div className="sql">{SQL}</div></div></div></div>
      <div className="divl"/>
      <div className="sstep"><div className="snum">2</div><div style={{flex:1}}><div className="stitle">Colar credenciais</div><div className="sdesc">Project Settings → API → copie a URL e a chave anon.</div>
        <div className="cinputs">
          <input placeholder="Project URL — https://xyz.supabase.co" value={url} onChange={e=>setUrl(e.target.value)}/>
          <input placeholder="anon public — eyJhbGci..." value={key} onChange={e=>setKey(e.target.value)} type="password"/>
        </div>
        {error&&<div className="errbox">⚠ {error}</div>}
        <button className="btn-conn" onClick={connect} disabled={!url||!key||loading}>{loading?"Conectando...":"Conectar →"}</button>
      </div></div>
    </div></div>
  );
}

export default function App() {
  const [config,setConfig]=useState(()=>{ try{ const s=localStorage.getItem("trial-cfg"); return s?JSON.parse(s):null; }catch{return null;} });
  const [client,setClient]=useState(()=>{ try{ const s=localStorage.getItem("trial-cfg"); if(s){const c=JSON.parse(s);return createClient(c.url,c.key);} }catch{} return null; });
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("Todos");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [toast,setToast]=useState("");
  const [form,setForm]=useState({name:"",qty:1,emoji:"📦",category:"Geral",img:null});
  const tt=useRef(null);

  useEffect(()=>{ if(client) fetch2(); },[client]);

  const fetch2=async()=>{ setLoading(true); try{setItems(await client.getAll());}catch{showToast("Erro ao carregar");} finally{setLoading(false);} };
  const handleConnect=(url,key)=>{ const cfg={url,key}; localStorage.setItem("trial-cfg",JSON.stringify(cfg)); setConfig(cfg); setClient(createClient(url,key)); };
  const showToast=(m)=>{ setToast(m); clearTimeout(tt.current); tt.current=setTimeout(()=>setToast(""),2500); };

  const changeQty=async(item,d)=>{
    const nq=Math.max(0,item.qty+d);
    setItems(p=>p.map(i=>i.id===item.id?{...i,qty:nq}:i));
    try{await client.update(item.id,{qty:nq});}
    catch{setItems(p=>p.map(i=>i.id===item.id?{...i,qty:item.qty}:i));}
  };

  const openAdd=()=>{setEditing(null);setForm({name:"",qty:1,emoji:"📦",category:"Geral",img:null});setModal(true);};
  const openEdit=(item)=>{setEditing(item);setForm({name:item.name,qty:item.qty,emoji:item.emoji||"📦",category:item.category||"Geral",img:item.img});setModal(true);};

  const handleSave=async()=>{
    if(!form.name.trim())return; setSaving(true);
    try{
      const payload={name:form.name.trim(),qty:Number(form.qty),emoji:form.emoji,category:form.category,img:null};
      if(editing){const u=await client.update(editing.id,payload);setItems(p=>p.map(i=>i.id===editing.id?(u||{...i,...payload}):i));showToast("Atualizado ✓");}
      else{const c=await client.insert(payload);setItems(p=>[c||{id:Date.now(),...payload},...p]);showToast("Adicionado ✓");}
      setModal(false);
    }catch{showToast("Erro ao salvar");}
    finally{setSaving(false);}
  };

  const handleDelete=async(item)=>{
    setItems(p=>p.filter(i=>i.id!==item.id));
    try{await client.remove(item.id);showToast("Excluído");}
    catch{setItems(p=>[item,...p]);}
  };

  if(!config) return <SetupWizard onConnect={handleConnect}/>;

  const cats=["Todos",...CATEGORIES];
  const visible=items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())&&(filter==="Todos"||i.category===filter));
  const low=items.filter(i=>i.qty<=5).length;

  return (
    <div><style>{css}</style>
    <div className="app">
      <div className="header">
        <div><div className="logo">Trial<span>.</span></div></div>
        <div className="header-meta"><strong>{items.length}</strong>produtos{low>0&&<div style={{color:"#FF4444",marginTop:4}}>⚠ {low} baixo</div>}</div>
      </div>
      <div className="toolbar">
        <input className="search-box" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button className="btn-add" onClick={openAdd}>+ Novo</button>
      </div>
      <div className="filters">{cats.map(c=><button key={c} className={`pill${filter===c?" active":""}`} onClick={()=>setFilter(c)}>{c}</button>)}</div>
      <div className="grid">
        {loading?<div style={{gridColumn:"1/-1",textAlign:"center",padding:60,color:MUTED}}>Carregando...</div>:
        visible.length===0?<div className="empty"><div style={{fontSize:40,marginBottom:12}}>📭</div><div style={{fontFamily:"Syne",fontSize:18,fontWeight:700,color:"#2a2a2a"}}>Nenhum item</div></div>:
        visible.map((item,idx)=>(
          <div className="card" key={item.id}>
            <div className="card-img" onClick={()=>openEdit(item)}>
              {item.img?<img src={item.img} alt={item.name}/>:<span style={{fontSize:48}}>{item.emoji||"📦"}</span>}
              {item.qty<=5&&<div className="badge-low">Baixo</div>}
            </div>
            <div className="card-body">
              <div><div className="card-name">{item.name}</div><div className="card-cat">{item.category}</div></div>
              <div className="qty-row">
                <div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em"}}>Estoque</div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={()=>changeQty(item,-1)} disabled={item.qty===0}>−</button>
                  <div className="qty-div"/>
                  <div className={`qty-val${item.qty<=5?" low":item.qty>=20?" ok":""}`}>{item.qty}</div>
                  <div className="qty-div"/>
                  <button className="qty-btn" onClick={()=>changeQty(item,+1)}>+</button>
                </div>
              </div>
              <div className="card-acts">
                <button className="bico" onClick={()=>openEdit(item)}>Editar</button>
                <button className="bico" onClick={()=>handleDelete(item)}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {modal&&(
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
        <div className="modal">
          <div className="modal-title">{editing?"Editar":"Novo"} <span>Item</span></div>
          <div className="field"><label>Nome *</label><input placeholder="Ex: Camiseta Branca G" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/></div>
          <div className="field"><label>Ícone</label><div className="erow">{EMOJIS.map(e=><button key={e} className={`epill${form.emoji===e?" sel":""}`} onClick={()=>setForm(f=>({...f,emoji:e}))}>{e}</button>)}</div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div className="field"><label>Categoria</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Quantidade</label><input type="number" min={0} value={form.qty} onChange={e=>setForm(f=>({...f,qty:Math.max(0,Number(e.target.value))}))} /></div>
          </div>
          <div className="mfoot">
            <button className="btn-x" onClick={()=>setModal(false)}>Cancelar</button>
            <button className="btn-ok" onClick={handleSave} disabled={!form.name.trim()||saving}>{saving?"Salvando...":editing?"Salvar":"Adicionar"}</button>
          </div>
        </div>
      </div>
    )}
    {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}
