import json
import os

input_file = '/Users/pavankumar/Desktop/diploma/ECET-exam-simulator/ecet-omni-portal/ecet papers/ecet_2020_cse.json'
output_file = '/Users/pavankumar/Desktop/diploma/ECET-exam-simulator/ecet-omni-portal/ecet papers/ecet_2020_cse_inverted.json'

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The application strictly expects:
# 0-49: Mathematics
# 50-74: Physics
# 75-99: Chemistry
# 100-199: Core

if len(data) >= 100:
    math = data[0:50]
    phys = data[50:75]
    chem = data[75:100]
    core = data[100:]
    
    # Reverse within each subject
    inverted_data = math[::-1] + phys[::-1] + chem[::-1] + core[::-1]
else:
    # Fallback if paper is small
    inverted_data = data[::-1]

# reverse the options and update correct answer for each
for idx, q in enumerate(inverted_data):
    # Fix the question number
    q['questionNumber'] = idx + 1
    
    # Reverse options and fix correct answer
    if 'options' in q and isinstance(q['options'], list):
        old_ans = q['correctAnswerNum']
        num_options = len(q['options'])
        
        q['options'] = q['options'][::-1]
        
        # New correct answer is (num_options - 1) - old_ans
        if old_ans >= 0 and old_ans < num_options:
            q['correctAnswerNum'] = (num_options - 1) - old_ans

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(inverted_data, f, indent=2, ensure_ascii=False)

print("Inverted paper generated successfully with correct subject order.")
