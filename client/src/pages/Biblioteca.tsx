import React, { useState } from 'react';

// ============================================
// GAVINHO - Página Biblioteca
// ============================================

// CORES
const COLORS = {
  warmBeige: '#ADAA96',
  softCream: '#F2F0E7',
  oliveGray: '#8B8670',
  white: '#FFFFFF',
  textDark: '#3D3D3D',
  textMuted: '#6B6B6B',
  borderLight: '#E5E2D9',
  progressBg: '#DCD9CF',
  danger: '#9A6B5B',
};

// ============================================
// ÍCONES SVG
// ============================================

const IconSearch = ({ size = 16, color = COLORS.oliveGray }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const IconPlus = ({ size = 14, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconTag = ({ size = 14, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconCube = ({ size = 14, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);

const IconStar = ({ size = 14, color = 'currentColor', filled = false }) => (
  <svg viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconFolder = ({ size = 14, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconUpload = ({ size = 14, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconGrid = ({ size = 16, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconList = ({ size = 16, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconTrend = ({ size = 12, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconChat = ({ size = 12, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconTrash = ({ size = 12, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconChevronDown = ({ size = 12, color = COLORS.oliveGray }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

// ============================================
// COMPONENTE: MaterialCard
// ============================================

const MaterialCard = ({ material, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);

  const styles = {
    card: {
      background: COLORS.white,
      borderRadius: 10,
      border: `1px solid ${isHovered ? COLORS.warmBeige : COLORS.borderLight}`,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isHovered ? '0 8px 24px rgba(139, 134, 112, 0.12)' : 'none',
      transform: isHovered ? 'translateY(-2px)' : 'none',
    },
    image: {
      width: '100%',
      height: 160,
      background: material.image 
        ? `url(${material.image}) center/cover no-repeat`
        : `linear-gradient(135deg, ${COLORS.softCream} 0%, ${COLORS.borderLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: 14,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    name: {
      fontSize: 14,
      fontWeight: 700,
      color: COLORS.textDark,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    },
    actionsTop: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    favoriteBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryTag: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      padding: '4px 8px',
      borderRadius: 4,
      backgroundColor: COLORS.warmBeige,
      color: COLORS.white,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    },
    description: {
      fontSize: 11,
      color: COLORS.textMuted,
      marginBottom: 10,
      lineHeight: 1.4,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    },
    supplier: {
      fontSize: 11,
      color: COLORS.warmBeige,
      marginBottom: 6,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    },
    price: {
      fontSize: 13,
      fontWeight: 700,
      color: COLORS.textDark,
      marginBottom: 12,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    },
    actions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      paddingTop: 12,
      borderTop: `1px solid ${COLORS.borderLight}`,
    },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '6px 10px',
      fontSize: 10,
      color: COLORS.oliveGray,
      background: 'transparent',
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 4,
      cursor: 'pointer',
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
      transition: 'all 0.2s',
    },
    deleteBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '6px 10px',
      fontSize: 10,
      color: COLORS.oliveGray,
      background: 'transparent',
      border: '1px solid transparent',
      borderRadius: 4,
      cursor: 'pointer',
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
      marginLeft: 'auto',
      transition: 'all 0.2s',
    },
  };

  return (
    <div
      style={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.image} />
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.name}>{material.nome}</div>
          <div style={styles.actionsTop}>
            <button 
              style={styles.favoriteBtn}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(material.id);
              }}
            >
              <IconStar size={16} color={material.favorito ? COLORS.warmBeige : COLORS.oliveGray} filled={material.favorito} />
            </button>
            <span style={styles.categoryTag}>{material.categoria}</span>
          </div>
        </div>
        <div style={styles.description}>{material.descricao}</div>
        <div style={styles.supplier}>Fornecedor: {material.fornecedor}</div>
        <div style={styles.price}>{material.preco}</div>
        <div style={styles.actions}>
          <button style={styles.actionBtn}>
            <IconTrend size={12} color={COLORS.oliveGray} />
            Histórico
          </button>
          <button style={styles.actionBtn}>
            <IconFolder size={12} color={COLORS.oliveGray} />
            Coleção
          </button>
          <button style={styles.actionBtn}>
            <IconChat size={12} color={COLORS.oliveGray} />
            Comentários
          </button>
          <button style={styles.actionBtn}>
            <IconFolder size={12} color={COLORS.oliveGray} />
            Projeto
          </button>
          <button style={styles.deleteBtn}>
            <IconTrash size={12} color={COLORS.oliveGray} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: FilterTag
// ============================================

const FilterTag = ({ label, active, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    padding: '6px 12px',
    fontSize: 11,
    color: active ? COLORS.white : COLORS.textMuted,
    background: active ? COLORS.warmBeige : 'transparent',
    border: `1px solid ${active ? COLORS.warmBeige : (isHovered ? COLORS.warmBeige : COLORS.borderLight)}`,
    borderRadius: 20,
    cursor: 'pointer',
    fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    transition: 'all 0.2s',
  };

  return (
    <button
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label}
    </button>
  );
};

// ============================================
// COMPONENTE: TabButton
// ============================================

const TabButton = ({ icon, label, count, active, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    fontSize: 13,
    color: active ? COLORS.white : COLORS.textMuted,
    background: active ? COLORS.warmBeige : 'transparent',
    border: `1px solid ${active ? COLORS.warmBeige : (isHovered ? COLORS.warmBeige : COLORS.borderLight)}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    transition: 'all 0.2s',
  };

  const countStyle = {
    background: 'rgba(255,255,255,0.3)',
    padding: '2px 6px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
  };

  return (
    <button
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      {label}
      {count !== undefined && <span style={countStyle}>{count}</span>}
    </button>
  );
};

// ============================================
// COMPONENTE PRINCIPAL: BibliotecaPage
// ============================================

const BibliotecaPage = () => {
  const [activeTab, setActiveTab] = useState('materiais');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTags, setActiveTags] = useState(['Luxo', 'Madeira']);
  const [materials, setMaterials] = useState([
    {
      id: 1,
      nome: 'Test Material Vitest',
      descricao: 'Test description',
      categoria: 'Madeira',
      fornecedor: 'Test Supplier',
      preco: '100.00 € / m²',
      image: null,
      favorito: false,
    },
    {
      id: 2,
      nome: 'TABU Pama - T1.002',
      descricao: 'A PAMA é uma madeira de origem sul-americana, particularmente encontrada na América do Sul, ilhas das Caraíbas...',
      categoria: 'Madeira',
      fornecedor: 'TABU',
      preco: '185.00 € / m²',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      favorito: false,
    },
    {
      id: 3,
      nome: 'Test Material Vitest',
      descricao: 'Test description',
      categoria: 'Madeira',
      fornecedor: 'Test Supplier',
      preco: '100.00 € / m²',
      image: null,
      favorito: true,
    },
    {
      id: 4,
      nome: 'Mármore Carrara Bianco',
      descricao: 'Mármore italiano de alta qualidade, ideal para bancadas e revestimentos de luxo.',
      categoria: 'Pedra',
      fornecedor: 'Marmi Italia',
      preco: '320.00 € / m²',
      image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=300&fit=crop',
      favorito: false,
    },
  ]);

  const filterTags = [
    'Art Deco', 'Branco', 'Clássico', 'Contemporâneo', 'Dourado',
    'Económico', 'Escandinavo', 'Indoor', 'Industrial', 'Luxo',
    'Madeira', 'Mediterrâneo', 'Minimalista', 'Neutro', 'Outdoor'
  ];

  const toggleTag = (tag) => {
    setActiveTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleFavorite = (id) => {
    setMaterials(prev =>
      prev.map(m => m.id === id ? { ...m, favorito: !m.favorito } : m)
    );
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: COLORS.softCream,
      padding: 32,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
    },
    pageHeader: {
      marginBottom: 24,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: 700,
      color: COLORS.textDark,
      marginBottom: 4,
      margin: 0,
    },
    pageSubtitle: {
      fontSize: 13,
      color: COLORS.textMuted,
      margin: 0,
    },
    toolbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 12,
    },
    toolbarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    toolbarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    btnOutline: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
      fontSize: 12,
      color: COLORS.oliveGray,
      background: 'transparent',
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
      transition: 'all 0.2s',
    },
    btnPrimary: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 16px',
      fontSize: 12,
      fontWeight: 700,
      color: COLORS.white,
      background: COLORS.warmBeige,
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
      transition: 'all 0.2s',
    },
    filtersSection: {
      background: COLORS.white,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      border: `1px solid ${COLORS.borderLight}`,
    },
    filtersRow: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    filtersRowLast: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 0,
    },
    searchInput: {
      flex: 1,
      padding: '10px 14px 10px 40px',
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 6,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
      fontSize: 13,
      backgroundColor: COLORS.white,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B8670' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '12px center',
      outline: 'none',
    },
    filterSelect: {
      padding: '10px 36px 10px 14px',
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 6,
      fontFamily: "'Quattrocento Sans', Arial, sans-serif",
      fontSize: 13,
      backgroundColor: COLORS.white,
      color: COLORS.textDark,
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B8670' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      outline: 'none',
    },
    viewToggle: {
      display: 'flex',
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 6,
      overflow: 'hidden',
    },
    viewBtn: {
      padding: '8px 12px',
      background: COLORS.white,
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    viewBtnActive: {
      padding: '8px 12px',
      background: COLORS.warmBeige,
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    filterTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
    },
    materialsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Biblioteca</h1>
        <p style={styles.pageSubtitle}>Materiais, modelos 3D e inspiração</p>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <TabButton
            icon={<IconTag size={14} color={activeTab === 'materiais' ? COLORS.white : COLORS.oliveGray} />}
            label="Materiais"
            count={12}
            active={activeTab === 'materiais'}
            onClick={() => setActiveTab('materiais')}
          />
          <TabButton
            icon={<IconCube size={14} color={activeTab === 'modelos' ? COLORS.white : COLORS.oliveGray} />}
            label="Modelos 3D"
            active={activeTab === 'modelos'}
            onClick={() => setActiveTab('modelos')}
          />
          <TabButton
            icon={<IconStar size={14} color={activeTab === 'inspiracao' ? COLORS.white : COLORS.oliveGray} />}
            label="Inspiração"
            count={1}
            active={activeTab === 'inspiracao'}
            onClick={() => setActiveTab('inspiracao')}
          />
        </div>
        <div style={styles.toolbarRight}>
          <button style={styles.btnOutline}>
            <IconTag size={14} color={COLORS.oliveGray} />
            Gerir Tags
          </button>
          <button style={styles.btnOutline}>
            <IconFolder size={14} color={COLORS.oliveGray} />
            Gerir Coleções
          </button>
          <button style={styles.btnOutline}>
            <IconStar size={14} color={COLORS.oliveGray} />
            Favoritos
          </button>
          <button style={styles.btnOutline}>
            <IconUpload size={14} color={COLORS.oliveGray} />
            Importar CSV/Excel
          </button>
          <button style={styles.btnPrimary}>
            <IconPlus size={14} color={COLORS.white} />
            Adicionar
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            style={styles.filterSelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            <option value="madeira">Madeira</option>
            <option value="pedra">Pedra</option>
            <option value="metal">Metal</option>
            <option value="texteis">Têxteis</option>
          </select>
          <select
            style={styles.filterSelect}
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">Todos os fornecedores</option>
            <option value="test">Test Supplier</option>
            <option value="tabu">TABU</option>
            <option value="marmi">Marmi Italia</option>
          </select>
          <div style={styles.viewToggle}>
            <button
              style={viewMode === 'grid' ? styles.viewBtnActive : styles.viewBtn}
              onClick={() => setViewMode('grid')}
            >
              <IconGrid size={16} color={viewMode === 'grid' ? COLORS.white : COLORS.oliveGray} />
            </button>
            <button
              style={viewMode === 'list' ? styles.viewBtnActive : styles.viewBtn}
              onClick={() => setViewMode('list')}
            >
              <IconList size={16} color={viewMode === 'list' ? COLORS.white : COLORS.oliveGray} />
            </button>
          </div>
        </div>
        <div style={styles.filtersRowLast}>
          <div style={styles.filterTags}>
            {filterTags.map(tag => (
              <FilterTag
                key={tag}
                label={tag}
                active={activeTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div style={styles.materialsGrid}>
        {materials.map(material => (
          <MaterialCard
            key={material.id}
            material={material}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};

export default BibliotecaPage;
