const categories = { thl: [{ url: `/posts/chimichurri/`, date: `02 Jul 2024`, title: `Chimichurri`},{ url: `/posts/accounting/`, date: `01 Jul 2024`, title: `accounting`},{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],ctf: [{ url: `/posts/predictable/`, date: `02 Jul 2024`, title: `Predictable`},{ url: `/posts/chimichurri/`, date: `02 Jul 2024`, title: `Chimichurri`},{ url: `/posts/master/`, date: `01 Jul 2024`, title: `Master`},{ url: `/posts/accounting/`, date: `01 Jul 2024`, title: `accounting`},{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],windows: [{ url: `/posts/chimichurri/`, date: `02 Jul 2024`, title: `Chimichurri`},{ url: `/posts/accounting/`, date: `01 Jul 2024`, title: `accounting`},{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],principiante: [{ url: `/posts/chimichurri/`, date: `02 Jul 2024`, title: `Chimichurri`},{ url: `/posts/accounting/`, date: `01 Jul 2024`, title: `accounting`},{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],dockerlabs: [{ url: `/posts/predictable/`, date: `02 Jul 2024`, title: `Predictable`},{ url: `/posts/master/`, date: `01 Jul 2024`, title: `Master`},{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},],linux: [{ url: `/posts/predictable/`, date: `02 Jul 2024`, title: `Predictable`},{ url: `/posts/master/`, date: `01 Jul 2024`, title: `Master`},{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},],medio: [{ url: `/posts/master/`, date: `01 Jul 2024`, title: `Master`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},],muy_facil: [{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},],avanzado: [{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},],AD: [{ url: `/posts/chimichurri/`, date: `02 Jul 2024`, title: `Chimichurri`},],muydificil: [{ url: `/posts/predictable/`, date: `02 Jul 2024`, title: `Predictable`},], }

console.log(categories)

window.onload = function () {
  document.querySelectorAll(".category").forEach((category) => {
    category.addEventListener("click", function (e) {
      const posts = categories[e.target.innerText.replace(" ","_")];
      let html = ``
      posts.forEach(post=>{
        html += `
        <a class="modal-article" href="${post.url}">
          <h4>${post.title}</h4>
          <small class="modal-article-date">${post.date}</small>
        </a>
        `
      })
      document.querySelector("#category-modal-title").innerText = e.target.innerText;
      document.querySelector("#category-modal-content").innerHTML = html;
      document.querySelector("#category-modal-bg").classList.toggle("open");
      document.querySelector("#category-modal").classList.toggle("open");
    });
  });

  document.querySelector("#category-modal-bg").addEventListener("click", function(){
    document.querySelector("#category-modal-title").innerText = "";
    document.querySelector("#category-modal-content").innerHTML = "";
    document.querySelector("#category-modal-bg").classList.toggle("open");
    document.querySelector("#category-modal").classList.toggle("open");
  })
};