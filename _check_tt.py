import sys
with open("src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Check what's in the TimingTower function
idx = content.find("function TimingTower(")
if idx >= 0:
    print("TimingTower found at", idx)
    print("Next 500 chars:", repr(content[idx:idx+500]))
else:
    print("TimingTower NOT FOUND")
    # Find it with partial match
    idx = content.find("TimingTower")
    if idx >= 0:
        print("TimingTower text at", idx, ":", repr(content[idx:idx+200]))
    else:
        print("TimingTower not in file at all")