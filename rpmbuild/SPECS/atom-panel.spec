Name:		atom-panel
Version:	0.1.0
Release:	1%{?dist}
Summary:	A custom dock extension for gnome-shell.
Group:		User Interface/Desktops
License:	GPLv3+
URL:		https://github.com/ozonos/atom-dock
Source0:	atom-panel-0.1.0.tar.gz

%description
 A custom panel for gnome-shell.
 This panel is part of the Atom Extension Set designed for Ozon OS.

%prep
%setup -q

%install
make install DESTDIR=%{buildroot}

%files
%defattr(-,root,root)
%{_datadir}/gnome-shell/extensions/%{name}@ozonos.org

%changelog
* Thu Nov 28 2014 Paolo Rotolo <paolorotolo@ubuntu.com> - 0.1.0-1
- Initial package for Fedora
