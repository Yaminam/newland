#!/usr/bin/env python3

import os

# Get current directory
cwd = os.getcwd()
file_path = os.path.join(cwd, "src/app/pages/onboarding/OnboardingPage.tsx")
output_path = os.path.join(cwd, "src/app/pages/onboarding/OnboardingPage_modified.tsx")

# Read the file with UTF-8 encoding
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Track changes made
changes = []

# STEP 1 (Type Selection) - around lines 365-410
for i, line in enumerate(lines):
    # Line 368: mb-8 -> mb-4 (after subtitle text in step 1)
    if i == 367 and 'mb-8' in line and 'text-sm' in line:
        lines[i] = line.replace('mb-8', 'mb-4')
        changes.append(f"Line {i+1}: Changed mb-8 to mb-4 (Step 1 subtitle)")
    
    # Line 371: gap-3 -> gap-2 (investor type cards)
    if i == 370 and 'gap-3' in line and 'grid grid-cols-1 sm:grid-cols-2' in line:
        lines[i] = line.replace('gap-3', 'gap-2')
        changes.append(f"Line {i+1}: Changed gap-3 to gap-2 (Step 1 grid)")
    
    # Line 379: p-5 -> p-3 (investor type card padding)
    if i == 378 and 'p-5' in line and 'rounded-xl text-left' in line:
        lines[i] = line.replace('p-5', 'p-3')
        changes.append(f"Line {i+1}: Changed p-5 to p-3 (Step 1 card padding)")
    
    # Line 381: minHeight: 120 -> 96
    if i == 380 and 'minHeight: 120' in line:
        lines[i] = line.replace('minHeight: 120', 'minHeight: 96')
        changes.append(f"Line {i+1}: Changed minHeight 120 to 96")
    
    # Line 388: w-12 h-12 -> w-10 h-10 and mb-3 -> mb-2
    if i == 387 and 'w-12 h-12' in line and 'mb-3' in line:
        lines[i] = line.replace('w-12 h-12', 'w-10 h-10').replace('mb-3', 'mb-2')
        changes.append(f"Line {i+1}: Changed w-12 h-12 to w-10 h-10 and mb-3 to mb-2")
    
    # Line 393: w-6 h-6 -> w-5 h-5
    if i == 392 and 'className="w-6 h-6"' in line:
        lines[i] = line.replace('className="w-6 h-6"', 'className="w-5 h-5"')
        changes.append(f"Line {i+1}: Changed w-6 h-6 to w-5 h-5")
    
    # Line 399-400: 0.9375rem -> 0.8125rem
    if i >= 398 and i <= 399 and "fontSize: '0.9375rem'" in line:
        lines[i] = line.replace("fontSize: '0.9375rem'", "fontSize: '0.8125rem'")
        changes.append(f"Line {i+1}: Changed fontSize 0.9375rem to 0.8125rem")

# STEP 2 (Profile) - around lines 415-550
for i, line in enumerate(lines):
    # Line 426: space-y-4 -> space-y-2
    if i == 425 and 'space-y-4' in line:
        lines[i] = line.replace('space-y-4', 'space-y-2')
        changes.append(f"Line {i+1}: Changed space-y-4 to space-y-2 (Step 2 profile)")
    
    # Line 428: gap-4 -> gap-3 (avatar section)
    if i == 427 and 'gap-4' in line and 'flex items-center' in line:
        lines[i] = line.replace('gap-4', 'gap-3')
        changes.append(f"Line {i+1}: Changed gap-4 to gap-3 (avatar section)")
    
    # Line 431: w-16 h-16 -> w-14 h-14 (avatar image)
    if i == 430 and 'w-16 h-16' in line and 'rounded-full' in line and 'object-cover' in line:
        lines[i] = line.replace('w-16 h-16', 'w-14 h-14')
        changes.append(f"Line {i+1}: Changed w-16 h-16 to w-14 h-14 (avatar image)")
    
    # Line 434: w-16 h-16 -> w-14 h-14 (avatar circle)
    if i == 433 and 'w-16 h-16' in line and 'rounded-full' in line and 'text-xl' in line:
        lines[i] = line.replace('w-16 h-16', 'w-14 h-14')
        changes.append(f"Line {i+1}: Changed w-16 h-16 to w-14 h-14 (avatar circle)")
    
    # Line 447: gap-3 -> gap-2 (profile grid)
    if i == 446 and 'gap-3' in line and 'grid' in line:
        lines[i] = line.replace('gap-3', 'gap-2')
        changes.append(f"Line {i+1}: Changed gap-3 to gap-2 (profile grid)")
    
    # Line 475: gap-3 -> gap-2 (profile grid - LinkedIn)
    if i == 474 and 'gap-3' in line and 'grid' in line:
        lines[i] = line.replace('gap-3', 'gap-2')
        changes.append(f"Line {i+1}: Changed gap-3 to gap-2 (profile grid 2)")

# STEP 3 (Focus) - around lines 585-630
for i, line in enumerate(lines):
    # Line 596: space-y-6 -> space-y-3
    if i == 595 and 'space-y-6' in line:
        lines[i] = line.replace('space-y-6', 'space-y-3')
        changes.append(f"Line {i+1}: Changed space-y-6 to space-y-3 (Step 3 focus)")

# ChipSelect: gap-2 -> gap-1
for i, line in enumerate(lines):
    if 'flex flex-wrap gap-2' in line and i < 100:
        lines[i] = line.replace('gap-2', 'gap-1')
        changes.append(f"Line {i+1}: Changed gap-2 to gap-1 (ChipSelect component)")
        break

# STEP 4 (Details) - around lines 630-800
for i, line in enumerate(lines):
    # Line 643: space-y-4 -> space-y-2
    if i == 642 and 'space-y-4' in line:
        lines[i] = line.replace('space-y-4', 'space-y-2')
        changes.append(f"Line {i+1}: Changed space-y-4 to space-y-2 (Step 4 details)")
    
    # Line 648: gap-3 -> gap-2
    if i == 647 and 'gap-3' in line and 'grid' in line:
        lines[i] = line.replace('gap-3', 'gap-2')
        changes.append(f"Line {i+1}: Changed gap-3 to gap-2 (Details grid 1)")
    
    # Line 669: gap-3 -> gap-2
    if i == 668 and 'gap-3' in line and 'grid' in line:
        lines[i] = line.replace('gap-3', 'gap-2')
        changes.append(f"Line {i+1}: Changed gap-3 to gap-2 (Details grid 2)")
    
    # Line 722: gap-3 -> gap-2
    if i == 721 and 'gap-3' in line and 'grid' in line:
        lines[i] = line.replace('gap-3', 'gap-2')
        changes.append(f"Line {i+1}: Changed gap-3 to gap-2 (Details grid 3)")
    
    # Line 706: py-2.5 -> py-2
    if i == 705 and 'py-2.5' in line:
        lines[i] = line.replace('py-2.5', 'py-2')
        changes.append(f"Line {i+1}: Changed py-2.5 to py-2 (Risk Appetite buttons)")

# STEP 5 and global changes
for i, line in enumerate(lines):
    # mb-2 -> mb-1 (headings)
    if 'text-2xl font-bold mb-2' in line:
        lines[i] = line.replace('mb-2', 'mb-1')
        changes.append(f"Line {i+1}: Changed mb-2 to mb-1 (heading)")

# Write the modified file
with open(output_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

# Print all changes made
print("Changes applied:")
for change in changes:
    print(f"  {change}")
print(f"\nTotal changes: {len(changes)}")

