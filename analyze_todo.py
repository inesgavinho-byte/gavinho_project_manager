import re
from collections import defaultdict

# Read todo.md
with open('todo.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse sections
sections = re.split(r'^## ', content, flags=re.MULTILINE)[1:]

results = []
total_completed = 0
total_pending = 0

for section in sections:
    lines = section.split('\n')
    section_name = lines[0].strip()
    
    completed = len(re.findall(r'^\- \[x\]', section, re.MULTILINE))
    pending = len(re.findall(r'^\- \[ \]', section, re.MULTILINE))
    total = completed + pending
    
    if total > 0:
        percentage = round((completed / total) * 100)
        status = "✅ Completo" if percentage == 100 else f"🔄 {percentage}%"
        priority = "🔴 Alta" if pending > 10 else "🟡 Média" if pending > 5 else "🟢 Baixa"
        
        results.append({
            'name': section_name,
            'completed': completed,
            'pending': pending,
            'total': total,
            'percentage': percentage,
            'status': status,
            'priority': priority if pending > 0 else "✅"
        })
        
        total_completed += completed
        total_pending += pending

# Sort by percentage (ascending) to show incomplete first
results.sort(key=lambda x: x['percentage'])

# Print results
print(f"\n{'='*100}")
print(f"GAVINHO PROJECT MANAGER - MAPA DE DESENVOLVIMENTO")
print(f"{'='*100}\n")

print(f"📊 ESTATÍSTICAS GLOBAIS:")
print(f"   Total de Tarefas: {total_completed + total_pending}")
print(f"   ✅ Concluídas: {total_completed} ({round((total_completed/(total_completed+total_pending))*100)}%)")
print(f"   ⏳ Pendentes: {total_pending} ({round((total_pending/(total_completed+total_pending))*100)}%)")
print(f"\n{'='*100}\n")

print(f"📋 MÓDULOS E FUNCIONALIDADES:\n")
print(f"{'Módulo':<60} {'Status':<15} {'Tarefas':<15} {'Prioridade':<15}")
print(f"{'-'*100}")

for r in results:
    tasks_str = f"{r['completed']}/{r['total']}"
    print(f"{r['name']:<60} {r['status']:<15} {tasks_str:<15} {r['priority']:<15}")

print(f"\n{'='*100}\n")

# Categorize by completion
complete = [r for r in results if r['percentage'] == 100]
in_progress = [r for r in results if 50 <= r['percentage'] < 100]
early_stage = [r for r in results if 1 <= r['percentage'] < 50]
not_started = [r for r in results if r['percentage'] == 0]

print(f"📈 RESUMO POR ESTADO:\n")
print(f"✅ Módulos Completos (100%): {len(complete)}")
for r in complete[:10]:  # Show first 10
    print(f"   • {r['name']}")
if len(complete) > 10:
    print(f"   ... e mais {len(complete)-10} módulos")

print(f"\n🔄 Módulos em Desenvolvimento (50-99%): {len(in_progress)}")
for r in in_progress:
    print(f"   • {r['name']} - {r['percentage']}% ({r['pending']} pendentes)")

print(f"\n🚧 Módulos em Fase Inicial (1-49%): {len(early_stage)}")
for r in early_stage:
    print(f"   • {r['name']} - {r['percentage']}% ({r['pending']} pendentes)")

print(f"\n⚪ Módulos Não Iniciados (0%): {len(not_started)}")
for r in not_started:
    print(f"   • {r['name']} ({r['total']} tarefas)")

print(f"\n{'='*100}\n")
