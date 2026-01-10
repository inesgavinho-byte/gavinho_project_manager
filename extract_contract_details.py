#!/usr/bin/env python3
"""
Script para extrair informações detalhadas dos contratos GAVINHO
Extrai: valores contratuais, prazos, fases, datas de assinatura, documentos anexos
"""

import os
import re
import json
from pathlib import Path
import PyPDF2
from docx import Document

def extract_from_pdf(filepath):
    """Extrai texto de PDF"""
    try:
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Erro ao ler PDF {filepath}: {e}")
        return ""

def extract_from_docx(filepath):
    """Extrai texto de DOCX"""
    try:
        doc = Document(filepath)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        print(f"Erro ao ler DOCX {filepath}: {e}")
        return ""

def extract_contract_value(text):
    """Extrai valor do contrato"""
    # Padrões comuns: "€ 1.234,56", "EUR 1234.56", "1.234,56 €"
    patterns = [
        r'€\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
        r'EUR\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
        r'(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€',
        r'valor.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
        r'honorários.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Retorna o maior valor encontrado (provavelmente o valor total)
            values = []
            for match in matches:
                # Converte para float
                value_str = match.replace('.', '').replace(',', '.')
                try:
                    values.append(float(value_str))
                except:
                    pass
            if values:
                return max(values)
    return None

def extract_dates(text):
    """Extrai datas do contrato"""
    dates = {}
    
    # Data de assinatura
    sign_patterns = [
        r'assinatura.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
        r'data.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
        r'signed.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
    ]
    
    for pattern in sign_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            dates['signature_date'] = match.group(1)
            break
    
    # Prazo de execução
    deadline_patterns = [
        r'prazo.*?(\d+)\s*(?:dias|meses|semanas)',
        r'duração.*?(\d+)\s*(?:dias|meses|semanas)',
        r'período.*?(\d+)\s*(?:dias|meses|semanas)',
    ]
    
    for pattern in deadline_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            dates['deadline_duration'] = match.group(0)
            break
    
    return dates

def extract_phases(text):
    """Extrai fases do projeto"""
    phases = []
    
    # Procura por seções numeradas ou com bullet points
    phase_patterns = [
        r'(?:fase|etapa|phase)\s*(\d+)[:\-\s]+([^\n]+)',
        r'(\d+)[\.º\)]\s*([^\n]+)',
    ]
    
    for pattern in phase_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            phase_name = match[1].strip()
            # Filtra linhas muito curtas ou muito longas
            if 10 < len(phase_name) < 100:
                phases.append({
                    'number': match[0],
                    'name': phase_name
                })
    
    # Remove duplicatas
    seen = set()
    unique_phases = []
    for phase in phases:
        if phase['name'] not in seen:
            seen.add(phase['name'])
            unique_phases.append(phase)
    
    return unique_phases[:10]  # Limita a 10 fases

def extract_client_info(text):
    """Extrai informações do cliente"""
    client_patterns = [
        r'cliente[:\s]+([^\n]+)',
        r'primeiro\s+outorgante[:\s]+([^\n]+)',
        r'contratante[:\s]+([^\n]+)',
    ]
    
    for pattern in client_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            client = match.group(1).strip()
            # Remove texto comum após o nome
            client = re.split(r',\s*com\s+sede|,\s*residente|,\s*contribuinte', client)[0]
            return client[:100]  # Limita tamanho
    
    return None

def extract_location(text):
    """Extrai localização do projeto"""
    location_patterns = [
        r'localização[:\s]+([^\n]+)',
        r'local[:\s]+([^\n]+)',
        r'morada[:\s]+([^\n]+)',
        r'sito\s+em\s+([^\n,]+)',
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            location = match.group(1).strip()
            return location[:150]  # Limita tamanho
    
    return None

def extract_contract_type(text):
    """Extrai tipo de contrato/serviço"""
    type_keywords = {
        'Arquitetura': ['arquitetura', 'projeto de arquitetura', 'architectural'],
        'Design de Interiores': ['design de interiores', 'decoração', 'interior design'],
        'Especialidades': ['especialidades', 'engenharia', 'estruturas'],
        'Gestão de Projeto': ['gestão de projeto', 'project management', 'coordenação'],
        'ArchViz': ['archviz', 'renderização', 'visualização', '3d', 'renders'],
        'Obra': ['obra', 'construção', 'execução'],
    }
    
    found_types = []
    text_lower = text.lower()
    
    for type_name, keywords in type_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                found_types.append(type_name)
                break
    
    return ' + '.join(found_types) if found_types else 'Arquitetura e Especialidades'

def process_contract(filepath, code):
    """Processa um contrato e extrai todas as informações"""
    print(f"\n📄 Processando: {code} - {os.path.basename(filepath)}")
    
    # Extrai texto
    if filepath.endswith('.pdf'):
        text = extract_from_pdf(filepath)
    elif filepath.endswith('.docx'):
        text = extract_from_docx(filepath)
    else:
        print(f"  ⚠️  Formato não suportado")
        return None
    
    if not text:
        print(f"  ❌ Não foi possível extrair texto")
        return None
    
    # Extrai informações
    contract_data = {
        'code': code,
        'value': extract_contract_value(text),
        'dates': extract_dates(text),
        'phases': extract_phases(text),
        'client': extract_client_info(text),
        'location': extract_location(text),
        'type': extract_contract_type(text),
        'text_length': len(text),
    }
    
    # Log do que foi encontrado
    if contract_data['value']:
        print(f"  💰 Valor: €{contract_data['value']:,.2f}")
    if contract_data['dates']:
        print(f"  📅 Datas: {contract_data['dates']}")
    if contract_data['client']:
        print(f"  👤 Cliente: {contract_data['client']}")
    if contract_data['location']:
        print(f"  📍 Localização: {contract_data['location']}")
    if contract_data['phases']:
        print(f"  📋 Fases encontradas: {len(contract_data['phases'])}")
    
    return contract_data

def main():
    upload_dir = Path('/home/ubuntu/upload')
    
    # Mapeamento de arquivos para códigos POP
    contracts = [
        ('POP.001.2025', 'POP.001.2025-MORADIADAGUIA2025-FINAL.pdf'),
        ('POP.007.2025', 'POP.007.2025-OEIRASHOUSES-S+KeS-v.26.05.2025finalparaassinatura.docx'),
        ('POP.008.2025', 'POP.008.2025-THAISMANSO-MORADIAANTONIOSALDANHA-Finalparaassinatura.pdf'),
        ('POP.010.2025', 'POP.010.2025-GESTÃODEPROJETO.pdf'),
        ('POP.017.2025', 'POP.017.2025-CASTILHO3_final.pdf'),
        ('POP.011.2024', 'POP.011.2024-ALGARVEARCHVIZ.pdf'),
        ('POP.013.2024', 'POP.013.2024-SHALVABUKIA-OBRA-signed_19.11.2024.pdf'),
        ('POP.014.2024', 'POP.014.2024-DECORRESTELO.v2_signed.pdf'),
        ('POP.022.2024', 'POP.022.2024-MYRIAD.signed_01.08.2024.pdf'),
        ('POP.026.2024', 'POP.026.2024-3aDECOR_signed.pdf'),
        ('POP.029.2024', 'POP.029.2024-MORADIACASCAIS-LOTE3_signed.pdf'),
        ('POP.033.2024', 'POP.033.2024-EDÍFICIOOEIRAS.pdf'),
        ('POP.035.2024', 'POP.035.2024-SHALVABUKIA_DECOR_signed19.11.2024.pdf'),
        ('POP.037.2024', 'POP.037.2024-PIP-ALGARVE.pdf'),
        ('POP.044.2024', 'POP.044.2024-AMELITALOTE12.pdf'),
        ('POP.054.2024', 'POP_054_2024_-_VILAS_CINQUO_SlInvestment,UnipessoalLdav.final.pdf'),
        ('POP.055.2024', 'POP.055.2024-EDIFÍCIOAMADORA_ZUME_signed.pdf.pdf'),
    ]
    
    all_data = []
    
    for code, filename in contracts:
        filepath = upload_dir / filename
        if filepath.exists():
            data = process_contract(str(filepath), code)
            if data:
                all_data.append(data)
        else:
            print(f"⚠️  Arquivo não encontrado: {filename}")
    
    # Salva resultados
    output_file = Path('/home/ubuntu/gavinho_project_manager/contracts_detailed.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Processados {len(all_data)} contratos")
    print(f"📁 Dados salvos em: {output_file}")
    
    # Estatísticas
    with_values = sum(1 for d in all_data if d['value'])
    with_phases = sum(1 for d in all_data if d['phases'])
    with_client = sum(1 for d in all_data if d['client'])
    with_location = sum(1 for d in all_data if d['location'])
    
    print(f"\n📊 Estatísticas:")
    print(f"  - Contratos com valor: {with_values}/{len(all_data)}")
    print(f"  - Contratos com fases: {with_phases}/{len(all_data)}")
    print(f"  - Contratos com cliente: {with_client}/{len(all_data)}")
    print(f"  - Contratos com localização: {with_location}/{len(all_data)}")

if __name__ == '__main__':
    main()
