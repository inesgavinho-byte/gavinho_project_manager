#!/usr/bin/env python3
"""
Script para extrair dados estruturados de contratos PDF/DOCX
"""
import os
import json
import re
from pathlib import Path

# Diretório com os contratos
CONTRACTS_DIR = "/home/ubuntu/upload"
OUTPUT_FILE = "/home/ubuntu/gavinho_project_manager/contracts_extracted.json"

def extract_pop_code(filename):
    """Extrair código POP do nome do ficheiro"""
    match = re.search(r'POP[._](\d+)[._](\d{4})', filename)
    if match:
        return f"POP.{match.group(1)}.{match.group(2)}"
    return None

def extract_project_name(filename):
    """Extrair nome do projeto do nome do ficheiro"""
    # Remover extensão e código POP
    name = re.sub(r'POP[._]\d+[._]\d{4}[-_]?', '', filename)
    name = re.sub(r'\.(pdf|docx)$', '', name, flags=re.IGNORECASE)
    # Remover sufixos comuns
    name = re.sub(r'[-_](FINAL|signed|v\.\d+|para.*assinatura).*$', '', name, flags=re.IGNORECASE)
    # Limpar caracteres especiais
    name = name.replace('_', ' ').replace('-', ' ')
    # Capitalizar
    return name.strip().title()

def determine_status(filename):
    """Determinar status do contrato baseado no nome do ficheiro"""
    filename_lower = filename.lower()
    if 'signed' in filename_lower or 'assinatura' in filename_lower:
        return 'signed'
    elif 'final' in filename_lower:
        return 'in_progress'
    else:
        return 'draft'

def main():
    contracts = []
    
    # Listar todos os ficheiros no diretório
    for filename in os.listdir(CONTRACTS_DIR):
        if not (filename.endswith('.pdf') or filename.endswith('.docx')):
            continue
        
        # Extrair informações do nome do ficheiro
        pop_code = extract_pop_code(filename)
        if not pop_code:
            print(f"⚠️  Não foi possível extrair código POP de: {filename}")
            continue
        
        project_name = extract_project_name(filename)
        status = determine_status(filename)
        
        # Extrair ano do código POP
        year_match = re.search(r'\.(\d{4})$', pop_code)
        year = int(year_match.group(1)) if year_match else 2024
        
        contract = {
            "code": pop_code,
            "name": project_name,
            "filename": filename,
            "status": status,
            "year": year,
            "client": f"Cliente {project_name}",  # Placeholder
            "location": "A definir",  # Placeholder
            "type": "Arquitetura e Especialidades",  # Placeholder
        }
        
        contracts.append(contract)
        print(f"✓ Extraído: {pop_code} - {project_name}")
    
    # Ordenar por código POP
    contracts.sort(key=lambda x: x['code'])
    
    # Guardar em JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(contracts, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ {len(contracts)} contratos extraídos para {OUTPUT_FILE}")
    
    # Mostrar resumo
    print("\n📊 Resumo por status:")
    status_count = {}
    for contract in contracts:
        status = contract['status']
        status_count[status] = status_count.get(status, 0) + 1
    
    for status, count in sorted(status_count.items()):
        print(f"   {status}: {count}")

if __name__ == "__main__":
    main()
