window.Pages=window.Pages||{};
Pages.auth=async(mode='login',admin)=>{
 const reg=mode==='register',next=admin?'dashboard.html':'index.html';
 document.body.innerHTML=`<div class="auth"><div class="auth-art"><div><h2>جایی که کارایی به بینش می‌رسد: داشبورد <span class="c-primary">میرون</span> برای تصمیم‌های هوشمندتر.</h2><svg viewBox="0 0 240 200" width="260" style="margin-top:24px"><circle cx="120" cy="100" r="86" fill="#eeebfe"/><rect x="70" y="60" width="100" height="70" rx="8" fill="#8c7bf7"/><rect x="82" y="74" width="50" height="6" rx="3" fill="#fff"/><rect x="82" y="88" width="76" height="6" rx="3" fill="#d9d3fb"/><circle cx="120" cy="160" r="14" fill="#ff5c39"/></svg></div></div>
 <div class="auth-form"><form id="af" novalidate><div class="text-center mb-3"><span class="stat-icon bg-primary round" style="margin:0 auto 10px;width:44px;height:44px">${icon('user')}</span><h2>${reg?'ایجاد حساب کاربری':'خوش آمدید!'}</h2><p class="muted">${reg?'اطلاعات خود را وارد کنید':'لطفاً اطلاعات ورود را وارد کنید'}</p></div>
 ${reg?'<div class="form-group"><label>نام و نام خانوادگی</label><input data-req="1" id="nm"></div>':''}
 <div class="form-group"><label>ایمیل</label><input type="email" data-req="1" id="em" style="direction:ltr;text-align:start" placeholder="name@example.com"></div>
 <div class="form-group"><label>رمز عبور</label><input type="password" data-req="1" id="pw" style="direction:ltr;text-align:start"></div>
 ${reg?'':'<div class="d-flex jc-b ai-c mb-3"><label class="d-flex ai-c gap-1"><input type="checkbox" checked>مرا به خاطر بسپار</label><a href="#">فراموشی رمز؟</a></div>'}
 <button class="btn btn-primary block lg">${reg?'ثبت‌نام':'ورود'}</button><div class="divider">یا</div>
 <div class="form-row"><button type="button" class="btn btn-o-light" data-soc>ادامه با گوگل</button><button type="button" class="btn btn-o-light" data-soc>ادامه با فیسبوک</button></div>
 <p class="text-center muted mt-3">${reg?'حساب دارید؟ <a href="login.html">ورود</a>':'حساب ندارید؟ <a href="register.html">ثبت‌نام</a>'}</p><p class="text-center muted fs-12">ورود نمایشی است؛ احراز هویت سمت سرور وجود ندارد.</p></form></div></div>`;
 $('#af').addEventListener('submit',e=>{e.preventDefault();if(!UI.validate(e.target))return;Store.set('user',{email:$('#em').value});UI.toast(reg?'ثبت‌نام نمایشی انجام شد':'ورود موفق (نمایشی)');setTimeout(()=>location.href=next,700)});
 document.addEventListener('click',e=>{if(e.target.closest('[data-soc]'))UI.toast('ورود با شبکه‌های اجتماعی در نسخه نمایشی فعال نیست')});
};
