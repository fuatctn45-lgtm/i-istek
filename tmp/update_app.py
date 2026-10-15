with open('/app/applet/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

target_old = """function makeSelectSearchable(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.customized) return;
    select.dataset.customized = "true";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    const list = document.createElement('div');
    list.className = 'custom-select-list';
    
    
    wrapper.appendChild(list);
    
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    select.style.display = 'none';
    
    const render = (filter = '') => {
        list.innerHTML = '';
        const searchVal = filter.toLowerCase("tr-TR");
        Array.from(select.options).forEach(opt => {
            if (opt.value === '') return;
            if (opt.text.toLowerCase("tr-TR").includes(searchVal)) {
                const item = document.createElement('div');
                item.className = 'custom-select-item';
                if(select.value === opt.value) item.classList.add('selected');
                
                let displayText = opt.text;
                if (selectId === 'costCenter') {
                    displayText = displayText.replace(/^[0-9]+-[0-9]+-/, '');
                }
                
                if (selectId === 'jobType') {
                    const rowBg = window.getRowBgColor(opt.text);
                    item.innerText = displayText;
                    if (rowBg !== 'transparent') {
                        item.style.backgroundColor = rowBg;
                        item.style.color = (rowBg === '#FF00FF' || rowBg === '#FF0000') ? '#FFFFFF' : '#000000';
                        item.style.fontWeight = 'bold';
                        item.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
                        item.style.borderRadius = '0';
                    }
                } else {
                    item.innerText = displayText;
                }
                
                item.onclick = () => {
                    window.triggerFeedback();
                    select.value = opt.value;
                    select.dispatchEvent(new Event('change'));
                    list.querySelectorAll('.custom-select-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    const stepEl = select.closest('.card-step');
                    if(stepEl) {
                        const currentStep = parseInt(stepEl.id.replace('step', ''));
                        setTimeout(() => window.nextStep(currentStep), 200);
                    }
                };
                list.appendChild(item);
            }
        });
    };
    
    
    const observer = new MutationObserver(() => render());
    observer.observe(select, { childList: true });
    
    render();
}"""

target_new = """function makeSelectSearchable(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.customized) return;
    select.dataset.customized = "true";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    
    // Modern Search Input
    const searchWrap = document.createElement('div');
    searchWrap.className = 'custom-select-search-wrap';
    
    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'custom-select-search-input';
    const placeholderText = selectId === 'costCenter' ? 'Bölüm veya hat ara...' :
                            selectId === 'machine' ? 'Makine veya ekipman ara...' :
                            selectId === 'shift' ? 'Vardiya ara...' :
                            selectId === 'jobType' ? 'İş / arıza türü ara...' : 'Listede ara...';
    searchInput.placeholder = placeholderText;
    
    searchWrap.appendChild(searchIcon);
    searchWrap.appendChild(searchInput);
    wrapper.appendChild(searchWrap);
    
    const list = document.createElement('div');
    list.className = 'custom-select-list';
    wrapper.appendChild(list);
    
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    select.style.display = 'none';
    
    searchInput.addEventListener('input', (e) => {
        render(e.target.value);
    });
    
    const render = (filter = '') => {
        list.innerHTML = '';
        const searchVal = filter.toLowerCase("tr-TR").trim();
        const validOptions = Array.from(select.options).filter(opt => opt.value !== '');
        
        // Hide search bar if few options
        if (validOptions.length <= 4) {
            searchWrap.style.display = 'none';
        } else {
            searchWrap.style.display = 'flex';
        }
        
        let matchCount = 0;
        validOptions.forEach(opt => {
            if (searchVal === '' || opt.text.toLowerCase("tr-TR").includes(searchVal)) {
                matchCount++;
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'custom-select-item';
                if (select.value === opt.value) item.classList.add('selected');
                
                let displayText = opt.text;
                if (selectId === 'costCenter') {
                    displayText = displayText.replace(/^[0-9]+-[0-9]+-/, '');
                }
                
                const textSpan = document.createElement('span');
                textSpan.className = 'item-text';
                textSpan.textContent = displayText;
                
                const checkWrap = document.createElement('span');
                checkWrap.className = 'item-check';
                checkWrap.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                
                item.appendChild(textSpan);
                item.appendChild(checkWrap);
                
                if (selectId === 'jobType') {
                    const rowBg = window.getRowBgColor(opt.text);
                    if (rowBg !== 'transparent') {
                        item.style.borderLeft = `5px solid ${rowBg}`;
                    }
                }
                
                item.onclick = (e) => {
                    e.preventDefault();
                    window.triggerFeedback();
                    select.value = opt.value;
                    select.dispatchEvent(new Event('change'));
                    list.querySelectorAll('.custom-select-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    const stepEl = select.closest('.card-step');
                    if (stepEl) {
                        const currentStep = parseInt(stepEl.id.replace('step', ''));
                        setTimeout(() => window.nextStep(currentStep), 220);
                    }
                };
                list.appendChild(item);
            }
        });
        
        if (matchCount === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'custom-select-empty';
            emptyEl.textContent = 'Eşleşen sonuç bulunamadı.';
            list.appendChild(emptyEl);
        }
    };
    
    const observer = new MutationObserver(() => render(searchInput.value));
    observer.observe(select, { childList: true });
    
    render();
}"""

if target_old in code:
    code = code.replace(target_old, target_new)
    with open('/app/applet/app.js', 'w', encoding='utf-8') as f:
        f.write(code)
    with open('/app/applet/public/app.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print('SUCCESS')
else:
    print('NOT_FOUND')
