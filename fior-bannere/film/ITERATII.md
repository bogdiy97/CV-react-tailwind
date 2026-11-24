# Jurnal: 50 de iterații pe două filme

Două filme noi, lucrate în paralel și îmbunătățite pas cu pas. Materialele vechi nu sunt atinse.

- **A – `fior-film-3`, „Esența rafinamentului”**: filmarea oficială Fior (doamna în rochie roșie) + efecte WebGL. 30 s.
- **B – `fior-film-craciun`, „Un fior de Crăciun”**: ninsoare, brad din particule, cadouri. 30 s.

Cum lucrez la fiecare iterație: randez cadre de control, aleg cea mai slabă parte, o repar, randez din nou și compar.
Nu pot vedea mișcarea și nu pot auzi muzica: verific pe cadre dese și pe măsurători (niveluri, sincron, spectru).

Comenzi:

```bash
python3 fior-bannere/film/cadre.py                 # o singură dată: extrage cadrele din filmarea oficială
node fior-bannere/film/storyboard.cjs film-3.html /tmp/a.png 1 5 9 12.2 18 22 26 29   # planșă de control
node fior-bannere/film/render-film.cjs 3           # -> video/fior-film-3.mp4
node fior-bannere/film/render-film.cjs craciun     # -> video/fior-film-craciun.mp4
```

| # | Film | Ce am schimbat | De ce / ce am verificat |
|---|---|---|---|
| 1 | A + B | Prima versiune completă a ambelor filme. A: 8 scene (ușa, treptele, portretul, eticheta, tăieturi pe ritm, gama, turnatul, aurul lichid cu logo). B: 6 scene (noaptea cu ninsoare, sticla în lumină caldă, bradul din particule, cadourile pe ritm, gama, finalul în care bradul devine logo). Motor: cadre din filmare încărcate la cerere, corecție de culoare, ninsoare, particule care își schimbă forma. Muzică nouă cu instrumente eșantionate (MuseScore General), stil „lounge” pentru A și „Crăciun” pentru B. | Punct de plecare. Am verificat pe planșe că toate scenele se desenează și că filmele vechi (2 și cele de produs) ies la fel după mutarea codului comun. Am reparat pe drum un defect de font: literele cu diacritice puteau apărea cu alt font în primul cadru. |
