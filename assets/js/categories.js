const categories = { thl: [{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/accounting/`, date: `21 Jun 2024`, title: `Accounting`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],ctf: [{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},{ url: `/posts/accounting/`, date: `21 Jun 2024`, title: `Accounting`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],windows: [{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/accounting/`, date: `21 Jun 2024`, title: `Accounting`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],principiante: [{ url: `/posts/espeto/`, date: `23 Jun 2024`, title: `Espeto malagueño`},{ url: `/posts/accounting/`, date: `21 Jun 2024`, title: `Accounting`},{ url: `/posts/Ensala/`, date: `21 Jun 2024`, title: `Ensala de papas`},],dockerlabs: [{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},],linux: [{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},],medio: [{ url: `/posts/chocolatefire/`, date: `25 Jun 2024`, title: `ChocolateFire`},{ url: `/posts/hereBash/`, date: `22 Jun 2024`, title: `HereBash`},],muy_facil: [{ url: `/posts/obsession/`, date: `26 Jun 2024`, title: `Obsession`},],avanzado: [{ url: `/posts/debugsec/`, date: `29 Jun 2024`, title: `DebugSec`},], }

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